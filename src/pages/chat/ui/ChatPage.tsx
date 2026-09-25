import { useCallback, useMemo, useRef, useState } from 'react';

import { type Chat, resolveExistingChatId } from '@/entities/chat';
import {
  type ChatMessage,
  type OutgoingMessageStatus,
  pickStrongerStatus
} from '@/entities/message';
import type { SessionCredentials } from '@/entities/session';
import { useLoadChats } from '@/features/load-chats';
import {
  type MessageStatusPayload,
  type ReceiveStatus,
  useReceiveMessages
} from '@/features/receive-messages';
import { ChatPanel } from '@/widgets/chat-panel';
import { ChatSidebar } from '@/widgets/chat-sidebar';

import styles from './ChatPage.module.css';

type ChatPageProps = {
  credentials: SessionCredentials;
  onLogout: () => void;
};

/**
 * Обновляет статус исходящего в списке чата.
 */
const applyStatusToList = ({
  list,
  id,
  status
}: {
  list: ChatMessage[];
  id: string;
  status: OutgoingMessageStatus;
}): ChatMessage[] | null => {
  const index = list.findIndex(item => item.id === id);
  if (index < 0) {
    return null;
  }

  const existing = list[index];
  const nextStatus = pickStrongerStatus({
    current: existing.status,
    next: status
  });
  if (nextStatus === existing.status) {
    return null;
  }

  const next = [...list];
  next[index] = { ...existing, status: nextStatus };
  return next;
};

/** Страница чатов */
export const ChatPage = ({ credentials, onLogout }: ChatPageProps) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [messagesByChat, setMessagesByChat] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [receiveStatus, setReceiveStatus] = useState<ReceiveStatus>({
    state: 'listening'
  });

  const chatsRef = useRef(chats);
  chatsRef.current = chats;
  const activeChatIdRef = useRef(activeChatId);
  activeChatIdRef.current = activeChatId;

  const activeChat = useMemo(
    () => chats.find(chat => chat.chatId === activeChatId) ?? null,
    [chats, activeChatId]
  );

  const activeMessages = useMemo(() => {
    if (!activeChatId) {
      return [];
    }
    const list = messagesByChat[activeChatId] ?? [];
    return [...list].sort((a, b) => a.timestamp - b.timestamp);
  }, [activeChatId, messagesByChat]);

  /**
   * Подставляет чаты из getChats.
   */
  const handleChatsLoaded = useCallback((loaded: Chat[]) => {
    setChats(prev => {
      const byId = new Map(prev.map(chat => [chat.chatId, chat]));
      loaded.forEach(chat => {
        const existing = byId.get(chat.chatId);
        byId.set(chat.chatId, existing ? { ...existing, ...chat } : chat);
      });
      return Array.from(byId.values());
    });
  }, []);

  const { isLoading: isLoadingChats, error: loadError } = useLoadChats({
    credentials,
    onLoaded: handleChatsLoaded
  });

  /**
   * Добавляет/обновляет чат.
   */
  const upsertChat = useCallback((chat: Chat, select = true) => {
    setChats(prev => {
      const existing = prev.find(item => item.chatId === chat.chatId);
      if (!existing) {
        return [chat, ...prev];
      }

      return prev.map(item =>
        item.chatId === chat.chatId
          ? {
              ...item,
              title: chat.title || item.title,
              phone: chat.phone || item.phone
            }
          : item
      );
    });
    if (select) {
      setActiveChatId(chat.chatId);
    }
  }, []);

  /**
   * Добавляет сообщение; при дубликате усиливает status.
   */
  const appendMessage = useCallback((message: ChatMessage) => {
    setMessagesByChat(prev => {
      const list = prev[message.chatId] ?? [];
      const index = list.findIndex(item => item.id === message.id);
      if (index >= 0) {
        const existing = list[index];
        const nextStatus = pickStrongerStatus({
          current: existing.status,
          next: message.status
        });
        if (nextStatus === existing.status) {
          return prev;
        }
        const next = [...list];
        next[index] = { ...existing, status: nextStatus };
        return {
          ...prev,
          [message.chatId]: next
        };
      }

      return {
        ...prev,
        [message.chatId]: [...list, message]
      };
    });
  }, []);

  /**
   * Обновляет статус доставки/прочтения по idMessage.
   */
  const handleMessageStatus = useCallback(
    ({ id, chatId, status }: MessageStatusPayload) => {
      const canonicalChatId = resolveExistingChatId({
        chats: chatsRef.current,
        chatId
      });

      setMessagesByChat(prev => {
        const primaryList = prev[canonicalChatId];
        if (primaryList) {
          const updated = applyStatusToList({
            list: primaryList,
            id,
            status
          });
          if (updated) {
            return { ...prev, [canonicalChatId]: updated };
          }
        }

        for (const [key, list] of Object.entries(prev)) {
          const updated = applyStatusToList({ list, id, status });
          if (updated) {
            return { ...prev, [key]: updated };
          }
        }

        return prev;
      });
    },
    []
  );

  /**
   * Входящее из журнала / long-poll.
   */
  const handleIncoming = useCallback(
    ({
      message,
      chatPatch
    }: {
      message: ChatMessage;
      chatPatch: Pick<Chat, 'chatId' | 'title'> & { phone?: string };
    }) => {
      const canonicalChatId = resolveExistingChatId({
        chats: chatsRef.current,
        chatId: chatPatch.chatId,
        phone: chatPatch.phone
      });

      const shouldSelect =
        !activeChatIdRef.current || activeChatIdRef.current === canonicalChatId;

      upsertChat(
        {
          chatId: canonicalChatId,
          title: chatPatch.title,
          phone: chatPatch.phone ?? ''
        },
        shouldSelect
      );
      appendMessage({
        ...message,
        chatId: canonicalChatId
      });
    },
    [appendMessage, upsertChat]
  );

  useReceiveMessages({
    credentials,
    onIncoming: handleIncoming,
    onMessageStatus: handleMessageStatus,
    onStatus: setReceiveStatus
  });

  return (
    <div className={styles.page}>
      <ChatSidebar
        activeChatId={activeChatId}
        chats={chats}
        credentials={credentials}
        isLoadingChats={isLoadingChats}
        loadError={loadError}
        onChatCreated={upsertChat}
        onLogout={onLogout}
        onSelectChat={setActiveChatId}
        receiveStatus={receiveStatus}
      />
      <ChatPanel
        chat={activeChat}
        credentials={credentials}
        messages={activeMessages}
        onMessageSent={appendMessage}
      />
    </div>
  );
};
