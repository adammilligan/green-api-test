import { normalizePhone } from '@/shared/lib';

import type { Chat } from './types';

/**
 * Достаёт цифры телефона из chatId вида 7999...@c.us.
 */
const phoneFromChatId = (chatId: string): string | null => {
  const match = chatId.match(/^(\d+)@c\.us$/);
  return match ? match[1] : null;
};

/**
 * Ищет уже открытый чат по chatId или телефону (Telegram может отдать другой id).
 */
export const resolveExistingChatId = ({
  chats,
  chatId,
  phone
}: {
  chats: Chat[];
  chatId: string;
  phone?: string;
}): string => {
  const exact = chats.find(chat => chat.chatId === chatId);
  if (exact) {
    return exact.chatId;
  }

  const candidates = [
    phone ? normalizePhone(phone) : null,
    phoneFromChatId(chatId)
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    const matched = chats.find(
      chat =>
        chat.phone === candidate ||
        chat.chatId === `${candidate}@c.us` ||
        phoneFromChatId(chat.chatId) === candidate
    );
    if (matched) {
      return matched.chatId;
    }
  }

  return chatId;
};
