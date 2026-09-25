import { resolveApiUrl } from '@/shared/config/greenApi';

import type { SessionCredentials } from './types';

const STORAGE_KEY = 'green-api-max-session';

/**
 * Читает сессию из sessionStorage.
 */
export const loadSession = (): SessionCredentials | null => {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SessionCredentials>;
    if (!parsed.idInstance || !parsed.apiTokenInstance) {
      return null;
    }

    return {
      idInstance: parsed.idInstance,
      apiTokenInstance: parsed.apiTokenInstance,
      apiUrl: resolveApiUrl({
        idInstance: parsed.idInstance,
        apiUrl: parsed.apiUrl
      })
    };
  } catch {
    return null;
  }
};

/**
 * Сохраняет сессию в sessionStorage.
 */
export const saveSession = (credentials: SessionCredentials): void => {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
};

/**
 * Удаляет сессию из sessionStorage.
 */
export const clearSession = (): void => {
  sessionStorage.removeItem(STORAGE_KEY);
};
