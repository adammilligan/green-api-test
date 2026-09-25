import { useEffect, useRef, useState } from 'react';

import type { Chat } from '@/entities/chat';
import type { SessionCredentials } from '@/entities/session';
import { enableIncomingNotifications, getChats } from '@/shared/api/green-api';
import { sleep, toUserErrorMessage, withRateLimitRetry } from '@/shared/lib';

type UseLoadChatsParams = {
  credentials: SessionCredentials;
  onLoaded: (chats: Chat[]) => void;
};

type LoadState = {
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
};

const SETTINGS_FLAG_PREFIX = 'green-api-incoming-enabled:';

/**
 * Маппит ответ getChats в entity Chat.
 */
const mapChats = (remoteChats: Awaited<ReturnType<typeof getChats>>): Chat[] =>
  remoteChats
    .filter(chat => chat.type === 'user' || !chat.type)
    .map(chat => ({
      chatId: chat.chatId,
      phone:
        chat.phoneNumber && chat.phoneNumber > 0
          ? String(chat.phoneNumber)
          : '',
      name: chat.name || chat.username || chat.chatId
    }));

/**
 * Включает incomingWebhook один раз за сессию вкладки.
 */
const ensureIncomingEnabled = async ({
  credentials,
  signal
}: {
  credentials: SessionCredentials;
  signal: AbortSignal;
}): Promise<void> => {
  const settingsKey = `${SETTINGS_FLAG_PREFIX}${credentials.idInstance}`;
  if (sessionStorage.getItem(settingsKey) === '1') {
    return;
  }

  await withRateLimitRetry({
    signal,
    /** @returns результат setSettings */
    run: () =>
      enableIncomingNotifications({
        credentials,
        signal
      })
  });
  sessionStorage.setItem(settingsKey, '1');
  await sleep(2000);
};

/**
 * Человекочитаемая ошибка загрузки.
 */
const toLoadErrorMessage = (err: unknown): string =>
  toUserErrorMessage(err, 'Не удалось загрузить чаты');

/**
 * При входе включает incomingWebhook и подтягивает чаты с retry на 429.
 */
export const useLoadChats = ({
  credentials,
  onLoaded
}: UseLoadChatsParams): LoadState => {
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onLoadedRef = useRef(onLoaded);
  onLoadedRef.current = onLoaded;

  const credentialsKey = `${credentials.idInstance}:${credentials.apiTokenInstance}:${credentials.apiUrl}`;

  useEffect(() => {
    const controller = new AbortController();

    /**
     * Инициализация: settings → getChats.
     */
    const init = async () => {
      setIsLoading(true);
      setIsReady(false);
      setError(null);

      try {
        await ensureIncomingEnabled({
          credentials,
          signal: controller.signal
        });

        if (controller.signal.aborted) {
          return;
        }

        const remoteChats = await withRateLimitRetry({
          signal: controller.signal,
          baseDelayMs: 4000,
          retries: 5,
          /** @returns список чатов */
          run: () =>
            getChats({
              credentials,
              signal: controller.signal
            })
        });

        if (controller.signal.aborted) {
          return;
        }

        onLoadedRef.current(mapChats(remoteChats));
        setIsReady(true);
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        setError(toLoadErrorMessage(err));
        setIsReady(true);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void init();

    return () => {
      controller.abort();
    };
  }, [credentialsKey]);

  return { isLoading, isReady, error };
};
