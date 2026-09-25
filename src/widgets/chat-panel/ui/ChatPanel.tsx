import { useEffect, useRef } from 'react';

import type { Chat } from '@/entities/chat';
import { type ChatMessage, MessageStatusMark } from '@/entities/message';
import type { SessionCredentials } from '@/entities/session';
import { MessageComposer } from '@/features/send-message';
import { formatMessageTime } from '@/shared/lib';

import styles from './ChatPanel.module.css';

type ChatPanelProps = {
  credentials: SessionCredentials;
  chat: Chat | null;
  messages: ChatMessage[];
  onMessageSent: (message: ChatMessage) => void;
};

/** Панель активного чата: лента и композер */
export const ChatPanel = ({
  credentials,
  chat,
  messages,
  onMessageSent
}: ChatPanelProps) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chat?.chatId]);

  if (!chat) {
    return (
      <section className={styles.panel}>
        <p className={styles.placeholder}>Выберите чат или создайте новый</p>
      </section>
    );
  }

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <h2 className={styles.title}>{chat.title}</h2>
        <p className={styles.subtitle}>{chat.phone || chat.chatId}</p>
      </header>
      <div className={styles.messages}>
        {messages.length === 0 ? (
          <p className={styles.empty}>Напишите первое сообщение</p>
        ) : (
          messages.map(message => (
            <div
              className={[
                styles.bubbleRow,
                message.direction === 'outgoing'
                  ? styles.outgoing
                  : styles.incoming
              ].join(' ')}
              key={message.id}
            >
              <div
                className={[
                  styles.bubble,
                  message.direction === 'outgoing'
                    ? styles.bubbleOutgoing
                    : styles.bubbleIncoming
                ].join(' ')}
              >
                {message.text}
                <span className={styles.meta}>
                  <span className={styles.metaTime}>
                    {formatMessageTime(message.timestamp)}
                  </span>
                  {message.direction === 'outgoing' ? (
                    <MessageStatusMark status={message.status} />
                  ) : null}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <MessageComposer
        chatId={chat.chatId}
        credentials={credentials}
        onSent={onMessageSent}
      />
    </section>
  );
};
