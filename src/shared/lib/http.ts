/** Ошибка HTTP GREEN-API с кодом статуса */
export class GreenApiHttpError extends Error {
  status: number;

  /**
   * @param status - HTTP-код
   * @param message - текст ответа
   */
  constructor(status: number, message: string) {
    super(message);
    this.name = 'GreenApiHttpError';
    this.status = status;
  }
}

/**
 * Проверяет, что ошибка — лимит частоты (429).
 */
export const isRateLimitError = (error: unknown): boolean =>
  error instanceof GreenApiHttpError && error.status === 429;

/**
 * Пауза.
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

/**
 * Повторяет запрос при 429.
 */
export const withRateLimitRetry = async <T>({
  run,
  retries = 4,
  baseDelayMs = 2500,
  signal
}: {
  run: () => Promise<T>;
  retries?: number;
  baseDelayMs?: number;
  signal?: AbortSignal;
}): Promise<T> => {
  let attempt = 0;

  while (attempt < retries) {
    try {
      return await run();
    } catch (error) {
      attempt += 1;
      const canRetry = isRateLimitError(error) && attempt < retries;
      if (!canRetry) {
        throw error;
      }

      if (signal?.aborted) {
        throw error;
      }

      await sleep(baseDelayMs * attempt);
    }
  }

  throw new Error('withRateLimitRetry: unreachable');
};
