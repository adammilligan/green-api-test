export type MessageDirection = 'incoming' | 'outgoing';

/** Статус исходящего сообщения (GREEN-API outgoingMessageStatus / statusMessage) */
export type OutgoingMessageStatus =
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'noAccount';

export type ChatMessage = {
  id: string;
  chatId: string;
  text: string;
  timestamp: number;
  direction: MessageDirection;
  /** Только для исходящих */
  status?: OutgoingMessageStatus;
};
