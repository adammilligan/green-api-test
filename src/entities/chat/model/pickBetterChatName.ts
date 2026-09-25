import { normalizePhone } from '@/shared/lib';

/**
 * Слабое имя — пустое, chatId или телефон вместо имени контакта.
 */
const isWeakChatName = ({
  name,
  chatId,
  phone
}: {
  name?: string;
  chatId: string;
  phone?: string;
}): boolean => {
  if (!name) {
    return true;
  }
  if (name === chatId) {
    return true;
  }
  if (!phone) {
    return false;
  }
  const normalized = normalizePhone(phone);
  return name === phone || name === normalized;
};

/**
 * Не затирает реальное имя fallback-ом (chatId / телефон).
 */
export const pickBetterChatName = ({
  candidate,
  current,
  chatId,
  phone
}: {
  candidate?: string;
  current?: string;
  chatId: string;
  phone?: string;
}): string => {
  if (!isWeakChatName({ name: candidate, chatId, phone })) {
    return candidate as string;
  }
  if (!isWeakChatName({ name: current, chatId, phone })) {
    return current as string;
  }
  return candidate || current || phone || chatId;
};
