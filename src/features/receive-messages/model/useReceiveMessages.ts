import { useEffect, useRef } from 'react';

import type { SessionCredentials } from '@/entities/session';
import {
  deleteNotification,
  type JournalMessage,
  lastIncomingMessages,
  lastOutgoingMessages,
  receiveNotification
} from '@/shared/api/green-api';
import {
  JOURNAL_POLL_MS,
  RECEIVE_RETRY_DELAY_MS,
  RECEIVE_TIMEOUT_SEC
} from '@/shared/config/greenApi';
import { GreenApiHttpError, sleep, toUserErrorMessage } from '@/shared/lib';

import {
  type IncomingPayload,
  type MessageStatusPayload,
  parseIncomingWebhook,
  parseJournalItem,
  parseStatusWebhook
} from './parseNotifications';

export type { IncomingPayload, MessageStatusPayload };

export type ReceiveStatus = {
  state: 'listening' | 'error';
  lastWebhookType?: string;
  lastIncomingPreview?: string;
  error?: string;
};

type UseReceiveMessagesParams = {
  credentials: SessionCredentials | null;
  onIncoming: (payload: IncomingPayload) => void;
  onMessageStatus?: (payload: MessageStatusPayload) => void;
  onStatus?: (status: ReceiveStatus) => void;
};

/**
 * 401/429 на poll — нормальны (очередь/лимит), не красный баннер.
 */
const isSoftReceiveError = (err: unknown): boolean =>
  err instanceof GreenApiHttpError &&
  (err.status === 401 || err.status === 429);

/**
 * Текст ошибки приёма.
 */
const toReceiveError = (err: unknown): string =>
  toUserErrorMessage(err, 'Не удалось получить сообщения');

/**
 * Журнал + long-poll. Журнал — основной способ показать ответы в UI.
 */
export const useReceiveMessages = ({
  credentials,
  onIncoming,
  onMessageStatus,
  onStatus
}: UseReceiveMessagesParams): void => {
  const onIncomingRef = useRef(onIncoming);
  onIncomingRef.current = onIncoming;
  const onMessageStatusRef = useRef(onMessageStatus);
  onMessageStatusRef.current = onMessageStatus;
  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;

  const credentialsKey = credentials
    ? `${credentials.idInstance}:${credentials.apiTokenInstance}:${credentials.apiUrl}`
    : null;

  useEffect(() => {
    if (!credentials) {
      return undefined;
    }

    const active = credentials;
    const controller = new AbortController();
    let cancelled = false;
    const knownIds = new Set<string>();

    /**
     * Эмит сообщения с дедупом; статус обновляем всегда.
     */
    const emit = (payload: IncomingPayload) => {
      const { message } = payload;
      if (knownIds.has(message.id)) {
        if (message.status) {
          onMessageStatusRef.current?.({
            id: message.id,
            chatId: message.chatId,
            status: message.status
          });
        }
        return;
      }
      knownIds.add(message.id);
      onIncomingRef.current(payload);
      onStatusRef.current?.({
        state: 'listening',
        lastIncomingPreview: message.text.slice(0, 40)
      });
    };

    /**
     * Эмит статуса доставки/прочтения.
     */
    const emitStatus = (payload: MessageStatusPayload) => {
      knownIds.add(payload.id);
      onMessageStatusRef.current?.(payload);
      onStatusRef.current?.({
        state: 'listening',
        lastWebhookType: `status:${payload.status}`
      });
    };

    /**
     * Кладёт элементы журнала в UI.
     */
    const pushJournalItems = ({
      items,
      direction
    }: {
      items: JournalMessage[];
      direction: 'incoming' | 'outgoing';
    }): number => {
      let added = 0;
      for (const item of items) {
        const parsed = parseJournalItem(item, direction);
        if (!parsed) {
          continue;
        }
        const isNew = !knownIds.has(parsed.message.id);
        emit(parsed);
        if (isNew) {
          added += 1;
        }
      }
      return added;
    };

    /**
     * Подтянуть журналы входящих и исходящих.
     */
    const syncJournal = async () => {
      const [incoming, outgoing] = await Promise.all([
        lastIncomingMessages({
          credentials: active,
          minutes: 1440,
          signal: controller.signal
        }),
        lastOutgoingMessages({
          credentials: active,
          minutes: 1440,
          signal: controller.signal
        })
      ]);

      let added = 0;
      if (Array.isArray(incoming)) {
        added += pushJournalItems({ items: incoming, direction: 'incoming' });
      }
      if (Array.isArray(outgoing)) {
        added += pushJournalItems({ items: outgoing, direction: 'outgoing' });
      }
      return added;
    };

    /**
     * Один шаг long-poll.
     */
    const pollOnce = async (): Promise<'stop' | 'cont'> => {
      const notification = await receiveNotification({
        credentials: active,
        receiveTimeout: RECEIVE_TIMEOUT_SEC,
        signal: controller.signal
      });

      if (cancelled) {
        return 'stop';
      }
      if (!notification) {
        return 'cont';
      }

      onStatusRef.current?.({
        state: 'listening',
        lastWebhookType: notification.body.typeWebhook
      });

      const statusPayload = parseStatusWebhook(notification.body);
      if (statusPayload) {
        emitStatus(statusPayload);
      } else {
        const parsed = parseIncomingWebhook(notification.body);
        if (parsed) {
          emit(parsed);
        }
      }

      await deleteNotification({
        credentials: active,
        receiptId: notification.receiptId,
        signal: controller.signal
      });
      return 'cont';
    };

    /**
     * Цикл журнала.
     */
    const journalLoop = async () => {
      while (!cancelled) {
        try {
          const added = await syncJournal();
          onStatusRef.current?.({
            state: 'listening',
            lastWebhookType: added ? `journal +${added}` : 'journal ok'
          });
        } catch (err) {
          if (cancelled || controller.signal.aborted) {
            break;
          }
          if (isSoftReceiveError(err)) {
            onStatusRef.current?.({
              state: 'listening',
              lastWebhookType: 'journal soft-retry'
            });
          } else {
            onStatusRef.current?.({
              state: 'error',
              error: `journal: ${toReceiveError(err)}`
            });
          }
        }
        await sleep(JOURNAL_POLL_MS);
      }
    };

    /**
     * Цикл long-poll.
     */
    const receiveLoop = async () => {
      while (!cancelled) {
        try {
          if ((await pollOnce()) === 'stop') {
            break;
          }
        } catch (err) {
          if (cancelled || controller.signal.aborted) {
            break;
          }
          if (isSoftReceiveError(err)) {
            onStatusRef.current?.({
              state: 'listening',
              lastWebhookType: 'poll soft-retry'
            });
          } else {
            onStatusRef.current?.({
              state: 'error',
              error: `poll: ${toReceiveError(err)}`
            });
          }
          await sleep(RECEIVE_RETRY_DELAY_MS);
        }
      }
    };

    onStatusRef.current?.({ state: 'listening' });
    void journalLoop();
    void receiveLoop();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [credentialsKey]);
};
