import {
  FormEvent,
  KeyboardEvent,
  useLayoutEffect,
  useRef,
  useState
} from 'react';

import type { ChatMessage } from '@/entities/message';
import type { SessionCredentials } from '@/entities/session';
import { sendMessage } from '@/shared/api/green-api';
import { toUserErrorMessage } from '@/shared/lib';
import { Button } from '@/shared/ui/Button';
import { Spinner } from '@/shared/ui/Spinner';

import styles from './MessageComposer.module.css';

const TEXTAREA_MAX_HEIGHT_PX = 160;

type MessageComposerProps = {
  credentials: SessionCredentials;
  chatId: string;
  onSent: (message: ChatMessage) => void;
};

/** Композер отправки текстового сообщения */
export const MessageComposer = ({
  credentials,
  chatId,
  onSent
}: MessageComposerProps) => {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  /**
   * Растягивает поле ввода по содержимому (вверх до max-height).
   */
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) {
      return;
    }
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, TEXTAREA_MAX_HEIGHT_PX)}px`;
  }, [text]);

  /**
   * Отправляет сообщение через SendMessage.
   */
  const submit = async () => {
    const message = text.trim();
    if (!message || isSending) {
      return;
    }

    setError(null);
    setIsSending(true);

    try {
      const result = await sendMessage({
        credentials,
        chatId,
        message
      });

      onSent({
        id: result.idMessage,
        chatId,
        text: message,
        timestamp: Math.floor(Date.now() / 1000),
        direction: 'outgoing',
        status: 'sent'
      });
      setText('');
    } catch (err) {
      setError(toUserErrorMessage(err, 'Не удалось отправить сообщение'));
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Обработчик submit формы.
   */
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit();
  };

  /**
   * Enter без Shift отправляет сообщение.
   */
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  };

  return (
    <>
      {error ? <p className={styles.error}>{error}</p> : null}
      <form className={styles.form} onSubmit={handleSubmit}>
        <textarea
          className={styles.textarea}
          onChange={event => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Введите сообщение'
          ref={textareaRef}
          rows={1}
          value={text}
        />
        <Button disabled={isSending || !text.trim()} type='submit'>
          {isSending ? <Spinner /> : null}
          Отправить
        </Button>
      </form>
    </>
  );
};
