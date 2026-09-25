/** Дефолтный apiUrl (если не удалось вычислить по idInstance) */
export const DEFAULT_API_URL = 'https://api.green-api.com';

/**
 * Таймаут long-poll ReceiveNotification (сек).
 */
export const RECEIVE_TIMEOUT_SEC = 15;

/** Пауза после сетевой ошибки / 429 (мс) */
export const RECEIVE_RETRY_DELAY_MS = 5000;

/** Как часто подтягивать входящие из журнала (мс) */
export const JOURNAL_POLL_MS = 5000;

/**
 * Собирает apiUrl по idInstance: 4100... → https://4100.api.green-api.com
 */
export const resolveApiUrl = ({
  idInstance,
  apiUrl
}: {
  idInstance: string;
  apiUrl?: string;
}): string => {
  const trimmed = apiUrl?.trim().replace(/\/$/, '');
  if (trimmed) {
    return trimmed;
  }

  const prefix = idInstance.trim().slice(0, 4);
  if (/^\d{4}$/.test(prefix)) {
    return `https://${prefix}.api.green-api.com`;
  }

  return DEFAULT_API_URL;
};
