import type { OutgoingMessageStatus } from './types';

const STATUS_RANK: Record<OutgoingMessageStatus, number> = {
  sent: 1,
  delivered: 2,
  read: 3,
  failed: 0,
  noAccount: 0
};

const KNOWN_STATUSES = new Set<string>(Object.keys(STATUS_RANK));

/**
 * Нормализует строку статуса из API.
 */
export const parseOutgoingStatus = (
  value: string | undefined
): OutgoingMessageStatus | undefined => {
  if (!value || !KNOWN_STATUSES.has(value)) {
    return undefined;
  }
  return value as OutgoingMessageStatus;
};

/**
 * Выбирает более сильный статус (не откатываем read → delivered).
 */
export const pickStrongerStatus = ({
  current,
  next
}: {
  current?: OutgoingMessageStatus;
  next?: OutgoingMessageStatus;
}): OutgoingMessageStatus | undefined => {
  if (!next) {
    return current;
  }
  if (!current) {
    return next;
  }
  if (next === 'failed' || next === 'noAccount') {
    return next;
  }
  if (current === 'failed' || current === 'noAccount') {
    return current;
  }
  return STATUS_RANK[next] >= STATUS_RANK[current] ? next : current;
};
