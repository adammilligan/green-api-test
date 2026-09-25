import { DEFAULT_API_URL } from '@/shared/config/greenApi';
import { GreenApiHttpError } from '@/shared/lib';

export type GreenApiCredentials = {
  idInstance: string;
  apiTokenInstance: string;
  apiUrl: string;
};

export type CheckAccountResponse = {
  exist: boolean;
  chatId?: string;
  username?: string;
  phoneNumber?: number;
  fromCache?: boolean;
};

export type GreenApiChat = {
  chatId: string;
  name?: string;
  type?: string;
  phoneNumber?: number;
  username?: string;
};

export type SendMessageResponse = {
  idMessage: string;
};

export type IncomingNotificationBody = {
  typeWebhook: string;
  timestamp: number;
  idMessage: string;
  /** Для outgoingMessageStatus chatId приходит на верхнем уровне */
  chatId?: string;
  status?: string;
  senderData?: {
    chatId: string;
    chatName?: string;
    sender?: string;
    senderName?: string;
    senderContactName?: string;
    senderPhoneNumber?: number | string;
  };
  messageData?: {
    typeMessage: string;
    textMessage?: string;
    textMessageData?: {
      textMessage?: string;
    };
    extendedTextMessageData?: {
      text?: string;
      description?: string;
    };
    quotedMessage?: {
      typeMessage?: string;
      textMessage?: string;
      textMessageData?: {
        textMessage?: string;
      };
    };
  };
};

export type ReceiveNotificationResponse = {
  receiptId: number;
  body: IncomingNotificationBody;
} | null;

export type DeleteNotificationResponse = {
  result: boolean;
  reason?: string;
};

export type JournalMessage = {
  type: string;
  idMessage: string;
  timestamp: number;
  typeMessage: string;
  chatId: string;
  textMessage?: string;
  senderName?: string;
  /** Статус исходящего: delivered | read */
  statusMessage?: string;
};

type RequestParams = {
  credentials: GreenApiCredentials;
  method: string;
  httpMethod?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  query?: Record<string, string | number>;
};

/**
 * Собирает URL метода GREEN-API (напрямую на apiUrl инстанса).
 */
const buildUrl = ({
  credentials,
  method,
  query
}: Pick<RequestParams, 'credentials' | 'method' | 'query'>): string => {
  const { idInstance, apiTokenInstance, apiUrl } = credentials;
  const base = (apiUrl || DEFAULT_API_URL).replace(/\/$/, '');
  const path = `${base}/waInstance${idInstance}/${method}/${apiTokenInstance}`;

  if (!query) {
    return path;
  }

  const search = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    search.set(key, String(value));
  });

  return `${path}?${search.toString()}`;
};

/**
 * Базовый HTTP-запрос к GREEN-API.
 */
const request = async <T>({
  credentials,
  method,
  httpMethod = 'GET',
  body,
  signal,
  query
}: RequestParams): Promise<T> => {
  const response = await fetch(buildUrl({ credentials, method, query }), {
    method: httpMethod,
    headers: {
      'Content-Type': 'application/json'
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal
  });

  if (!response.ok) {
    const text = await response.text();
    throw new GreenApiHttpError(
      response.status,
      text || `HTTP ${response.status}`
    );
  }

  const text = await response.text();
  if (!text || text === 'null') {
    return null as T;
  }

  return JSON.parse(text) as T;
};

/**
 * Включает запись входящих уведомлений в HTTP-очередь.
 */
export const enableIncomingNotifications = ({
  credentials,
  signal
}: {
  credentials: GreenApiCredentials;
  signal?: AbortSignal;
}): Promise<{ saveSettings: boolean }> =>
  request({
    credentials,
    method: 'setSettings',
    httpMethod: 'POST',
    body: {
      webhookUrl: '',
      incomingWebhook: 'yes',
      outgoingWebhook: 'yes',
      outgoingMessageWebhook: 'yes',
      outgoingAPIMessageWebhook: 'yes',
      stateWebhook: 'yes'
    },
    signal
  });

/**
 * Получает список чатов инстанса.
 */
export const getChats = ({
  credentials,
  signal
}: {
  credentials: GreenApiCredentials;
  signal?: AbortSignal;
}): Promise<GreenApiChat[]> =>
  request<GreenApiChat[]>({
    credentials,
    method: 'getChats',
    httpMethod: 'GET',
    signal
  });

/**
 * Журнал входящих за N минут (запасной источник для UI).
 */
export const lastIncomingMessages = ({
  credentials,
  minutes = 1440,
  signal
}: {
  credentials: GreenApiCredentials;
  minutes?: number;
  signal?: AbortSignal;
}): Promise<JournalMessage[]> =>
  request<JournalMessage[]>({
    credentials,
    method: 'lastIncomingMessages',
    httpMethod: 'GET',
    query: { minutes },
    signal
  });

/**
 * Журнал исходящих за N минут.
 */
export const lastOutgoingMessages = ({
  credentials,
  minutes = 1440,
  signal
}: {
  credentials: GreenApiCredentials;
  minutes?: number;
  signal?: AbortSignal;
}): Promise<JournalMessage[]> =>
  request<JournalMessage[]>({
    credentials,
    method: 'lastOutgoingMessages',
    httpMethod: 'GET',
    query: { minutes },
    signal
  });

/**
 * Проверяет аккаунт по телефону и возвращает chatId Telegram.
 */
export const checkAccount = ({
  credentials,
  phoneNumber,
  signal
}: {
  credentials: GreenApiCredentials;
  phoneNumber: number;
  signal?: AbortSignal;
}): Promise<CheckAccountResponse> =>
  request<CheckAccountResponse>({
    credentials,
    method: 'checkAccount',
    httpMethod: 'POST',
    body: { phoneNumber },
    signal
  });

/**
 * Отправляет текстовое сообщение в чат.
 */
export const sendMessage = ({
  credentials,
  chatId,
  message,
  signal
}: {
  credentials: GreenApiCredentials;
  chatId: string;
  message: string;
  signal?: AbortSignal;
}): Promise<SendMessageResponse> =>
  request<SendMessageResponse>({
    credentials,
    method: 'sendMessage',
    httpMethod: 'POST',
    body: { chatId, message },
    signal
  });

/**
 * Получает следующее уведомление из очереди (long-poll).
 */
export const receiveNotification = ({
  credentials,
  receiveTimeout,
  signal
}: {
  credentials: GreenApiCredentials;
  receiveTimeout: number;
  signal?: AbortSignal;
}): Promise<ReceiveNotificationResponse> =>
  request<ReceiveNotificationResponse>({
    credentials,
    method: 'receiveNotification',
    httpMethod: 'GET',
    query: { receiveTimeout },
    signal
  });

/**
 * Подтверждает обработку уведомления и удаляет его из очереди.
 */
export const deleteNotification = ({
  credentials,
  receiptId,
  signal
}: {
  credentials: GreenApiCredentials;
  receiptId: number;
  signal?: AbortSignal;
}): Promise<DeleteNotificationResponse> =>
  request<DeleteNotificationResponse>({
    credentials,
    method: `deleteNotification/${receiptId}`,
    httpMethod: 'DELETE',
    signal
  });
