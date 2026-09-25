import type { Chat } from '@/entities/chat';
import {
  type ChatMessage,
  type OutgoingMessageStatus,
  parseOutgoingStatus
} from '@/entities/message';
import type {
  IncomingNotificationBody,
  JournalMessage
} from '@/shared/api/green-api';
import { normalizePhone } from '@/shared/lib';

export type IncomingPayload = {
  message: ChatMessage;
  chatPatch: Pick<Chat, 'chatId' | 'name'> & { phone?: string };
};

export type MessageStatusPayload = {
  id: string;
  chatId: string;
  status: OutgoingMessageStatus;
};

/**
 * Собирает имя чата.
 */
const resolveChatName = ({
  chatId,
  chatName,
  senderName,
  phone
}: {
  chatId: string;
  chatName?: string;
  senderName?: string;
  phone?: string;
}): string => chatName || senderName || phone || chatId;

/**
 * Текст из textMessage.
 */
const textFromBasic = (
  messageData: NonNullable<IncomingNotificationBody['messageData']>
): string | null =>
  messageData.textMessage || messageData.textMessageData?.textMessage || null;

/**
 * Текст из extended.
 */
const textFromExtended = (
  messageData: NonNullable<IncomingNotificationBody['messageData']>
): string | null =>
  messageData.extendedTextMessageData?.text ||
  messageData.extendedTextMessageData?.description ||
  null;

/**
 * Текст из quoted.
 */
const textFromQuoted = (
  messageData: NonNullable<IncomingNotificationBody['messageData']>
): string | null =>
  messageData.quotedMessage?.textMessage ||
  messageData.quotedMessage?.textMessageData?.textMessage ||
  null;

/**
 * Текст из messageData webhook.
 */
const extractText = (
  messageData: IncomingNotificationBody['messageData']
): string | null => {
  if (!messageData) {
    return null;
  }
  return (
    textFromBasic(messageData) ||
    textFromExtended(messageData) ||
    textFromQuoted(messageData)
  );
};

/**
 * Телефон из webhook.
 */
const resolvePhone = (
  senderPhoneNumber: number | string | undefined
): string | undefined => {
  if (senderPhoneNumber === undefined || senderPhoneNumber === null) {
    return undefined;
  }
  return normalizePhone(String(senderPhoneNumber));
};

/**
 * Парсит incomingMessageReceived.
 */
export const parseIncomingWebhook = (
  body: IncomingNotificationBody
): IncomingPayload | null => {
  if (body.typeWebhook !== 'incomingMessageReceived' || !body.senderData) {
    return null;
  }

  const text =
    extractText(body.messageData) ??
    `[${body.messageData?.typeMessage || 'входящее'}]`;
  const { chatId, chatName, senderName, senderContactName } = body.senderData;
  const phone = resolvePhone(body.senderData.senderPhoneNumber);

  return {
    message: {
      id: body.idMessage,
      chatId,
      text,
      timestamp: body.timestamp,
      direction: 'incoming'
    },
    chatPatch: {
      chatId,
      name: resolveChatName({
        chatId,
        chatName,
        senderName: senderName || senderContactName,
        phone
      }),
      phone
    }
  };
};

/**
 * Парсит outgoingMessageStatus.
 */
export const parseStatusWebhook = (
  body: IncomingNotificationBody
): MessageStatusPayload | null => {
  if (body.typeWebhook !== 'outgoingMessageStatus') {
    return null;
  }

  const status = parseOutgoingStatus(body.status);
  const chatId = body.chatId || body.senderData?.chatId;
  if (!status || !chatId || !body.idMessage) {
    return null;
  }

  return {
    id: body.idMessage,
    chatId,
    status
  };
};

/**
 * Парсит запись журнала (входящие / исходящие).
 */
export const parseJournalItem = (
  item: JournalMessage,
  direction: 'incoming' | 'outgoing'
): IncomingPayload | null => {
  if (item.typeMessage !== 'textMessage' || !item.textMessage) {
    return null;
  }

  const status =
    direction === 'outgoing'
      ? (parseOutgoingStatus(item.statusMessage) ?? 'sent')
      : undefined;

  return {
    message: {
      id: item.idMessage,
      chatId: item.chatId,
      text: item.textMessage,
      timestamp: item.timestamp,
      direction,
      status
    },
    chatPatch: {
      chatId: item.chatId,
      name: item.senderName || item.chatId
    }
  };
};
