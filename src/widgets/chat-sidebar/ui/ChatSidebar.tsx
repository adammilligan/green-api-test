import type { Chat } from '@/entities/chat';
import type { SessionCredentials } from '@/entities/session';
import { LogoutButton } from '@/features/auth';
import { CreateChatForm } from '@/features/create-chat';
import type { ReceiveStatus } from '@/features/receive-messages';

import styles from './ChatSidebar.module.css';

type ChatSidebarProps = {
  credentials: SessionCredentials;
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onChatCreated: (chat: Chat) => void;
  onLogout: () => void;
  receiveStatus?: ReceiveStatus;
  loadError?: string | null;
  isLoadingChats?: boolean;
};

/**
 * Строка статуса приёма / загрузки.
 */
const StatusLine = ({
  text,
  isError = false
}: {
  text: string;
  isError?: boolean;
}) => (
  <div
    className={[styles.status, isError ? styles.statusError : '']
      .filter(Boolean)
      .join(' ')}
  >
    {text}
  </div>
);

/**
 * Текст статуса long-poll.
 */
const receiveStatusText = (receiveStatus: ReceiveStatus): string => {
  if (receiveStatus.state === 'error') {
    return `Приём: ${receiveStatus.error || 'ошибка'}`;
  }

  const webhook = receiveStatus.lastWebhookType
    ? ` (${receiveStatus.lastWebhookType})`
    : '';
  const preview = receiveStatus.lastIncomingPreview
    ? ` ← ${receiveStatus.lastIncomingPreview}`
    : '';
  return `Приём: слушаю${webhook}${preview}`;
};

/** Сайдбар со списком чатов и формой нового чата */
export const ChatSidebar = ({
  credentials,
  chats,
  activeChatId,
  onSelectChat,
  onChatCreated,
  onLogout,
  receiveStatus,
  loadError,
  isLoadingChats
}: ChatSidebarProps) => (
  <aside className={styles.sidebar}>
    <div className={styles.header}>
      <h1 className={styles.brand}>Telegram</h1>
      <LogoutButton onLogout={onLogout} />
    </div>
    <CreateChatForm credentials={credentials} onCreated={onChatCreated} />
    {receiveStatus ? (
      <StatusLine
        isError={receiveStatus.state === 'error'}
        text={receiveStatusText(receiveStatus)}
      />
    ) : null}
    {loadError ? <StatusLine isError text={`Чаты: ${loadError}`} /> : null}
    {isLoadingChats ? <StatusLine text='Загрузка чатов…' /> : null}
    <div className={styles.list}>
      {chats.length === 0 && !isLoadingChats ? (
        <p className={styles.empty}>Создайте чат по номеру телефона</p>
      ) : (
        chats.map(chat => (
          <button
            className={[
              styles.item,
              chat.chatId === activeChatId ? styles.active : ''
            ]
              .filter(Boolean)
              .join(' ')}
            key={chat.chatId}
            onClick={() => onSelectChat(chat.chatId)}
            type='button'
          >
            <span className={styles.title}>{chat.title}</span>
            <span className={styles.subtitle}>{chat.phone || chat.chatId}</span>
          </button>
        ))
      )}
    </div>
  </aside>
);
