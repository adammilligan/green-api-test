/**
 * Нормализует телефон к международному виду без плюса (79991234567).
 */
export const normalizePhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, '');

  if (digits.length === 11 && digits.startsWith('8')) {
    return `7${digits.slice(1)}`;
  }

  return digits;
};

/**
 * Формирует chatId личного чата Telegram/WhatsApp в GREEN-API.
 */
export const toChatId = (phone: string): string => `${phone}@c.us`;

/**
 * Форматирует unix-timestamp (сек) в локальное время HH:MM.
 */
export const formatMessageTime = (timestampSec: number): string => {
  const date = new Date(timestampSec * 1000);

  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });
};
