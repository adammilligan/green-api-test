import type { OutgoingMessageStatus } from '../model/types';

import styles from './MessageStatusMark.module.css';

type MessageStatusMarkProps = {
  status?: OutgoingMessageStatus;
};

const STATUS_TITLE: Record<OutgoingMessageStatus, string> = {
  sent: 'Отправлено',
  delivered: 'Доставлено',
  read: 'Прочитано',
  failed: 'Ошибка отправки',
  noAccount: 'Нет аккаунта Telegram'
};

/** Галочки / ошибка статуса исходящего сообщения */
export const MessageStatusMark = ({ status }: MessageStatusMarkProps) => {
  if (!status) {
    return null;
  }

  const title = STATUS_TITLE[status];

  if (status === 'failed' || status === 'noAccount') {
    return (
      <span aria-label={title} className={styles.failed} title={title}>
        !
      </span>
    );
  }

  const isRead = status === 'read';
  const isDouble = status === 'delivered' || status === 'read';

  return (
    <span
      aria-label={title}
      className={[styles.mark, isRead ? styles.read : ''].join(' ')}
      title={title}
    >
      <span className={styles.check}>✓</span>
      {isDouble ? <span className={styles.checkOverlap}>✓</span> : null}
    </span>
  );
};
