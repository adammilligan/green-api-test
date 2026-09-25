import { GreenApiHttpError } from './http';

const NETWORK_PATTERNS = [
  'failed to fetch',
  'networkerror',
  'network request failed',
  'load failed',
  'fetch failed',
  'err_internet_disconnected',
  'err_network_changed',
  'err_connection',
  'net::err_',
  'the internet connection appears to be offline',
  'networkerror when attempting to fetch resource'
];

/**
 * Проверяет сетевую/офлайн ошибку.
 */
const isNetworkError = (err: unknown): boolean => {
  if (!(err instanceof Error)) {
    return false;
  }

  if (err.name === 'TypeError' && /fetch|network/i.test(err.message)) {
    return true;
  }

  const message = err.message.toLowerCase();
  return NETWORK_PATTERNS.some(pattern => message.includes(pattern));
};

/**
 * Проверяет отмену запроса.
 */
const isAbortError = (err: unknown): boolean => {
  if (!(err instanceof Error)) {
    return false;
  }
  return err.name === 'AbortError' || /aborted|abort/i.test(err.message);
};

/**
 * Текст по HTTP-коду GREEN-API.
 */
const messageFromHttpStatus = (status: number): string => {
  if (status === 400) {
    return 'Некорректный запрос к GREEN-API';
  }
  if (status === 401) {
    return 'Неверный idInstance или токен, либо очередь занята';
  }
  if (status === 403) {
    return 'Доступ к GREEN-API запрещён';
  }
  if (status === 404) {
    return 'Ресурс GREEN-API не найден';
  }
  if (status === 408 || status === 504) {
    return 'Превышено время ожидания ответа GREEN-API';
  }
  if (status === 429) {
    return 'Слишком много запросов. Подождите немного и повторите';
  }
  if (status >= 500) {
    return 'Ошибка сервера GREEN-API. Попробуйте позже';
  }
  return `Ошибка GREEN-API (код ${status})`;
};

/**
 * Человекочитаемое сообщение об ошибке для UI.
 */
export const toUserErrorMessage = (
  err: unknown,
  fallback = 'Что-то пошло не так. Попробуйте ещё раз'
): string => {
  if (isAbortError(err)) {
    return 'Запрос отменён';
  }

  if (isNetworkError(err)) {
    return 'Нет соединения с интернетом. Проверьте сеть и попробуйте снова';
  }

  if (err instanceof GreenApiHttpError) {
    return messageFromHttpStatus(err.status);
  }

  if (err instanceof Error && err.message.trim()) {
    const message = err.message.trim();
    // свои русские тексты оставляем, сырой английский API/браузера — нет
    if (/[А-Яа-яЁё]/.test(message)) {
      return message;
    }
  }

  return fallback;
};
