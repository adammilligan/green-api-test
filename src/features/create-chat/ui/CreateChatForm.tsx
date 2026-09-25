import { FormEvent, useState } from 'react';

import type { Chat } from '@/entities/chat';
import type { SessionCredentials } from '@/entities/session';
import { checkAccount } from '@/shared/api/green-api';
import { normalizePhone, toUserErrorMessage } from '@/shared/lib';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Spinner } from '@/shared/ui/Spinner';

import styles from './CreateChatForm.module.css';

type CreateChatFormProps = {
  credentials: SessionCredentials;
  onCreated: (chat: Chat) => void;
};

/** Форма создания чата по номеру (checkAccount → chatId Telegram) */
export const CreateChatForm = ({
  credentials,
  onCreated
}: CreateChatFormProps) => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Создаёт чат через checkAccount.
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const normalized = normalizePhone(phone);
    if (normalized.length < 11) {
      setError('Введите номер в формате 79991234567');
      return;
    }

    setIsLoading(true);
    try {
      const result = await checkAccount({
        credentials,
        phoneNumber: Number(normalized)
      });

      if (!result.exist || !result.chatId) {
        setError('Аккаунт Telegram на этом номере не найден');
        return;
      }

      onCreated({
        chatId: result.chatId,
        phone: normalized,
        title: result.username || normalized
      });
      setPhone('');
    } catch (err) {
      setError(toUserErrorMessage(err, 'Не удалось создать чат'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.row}>
        <Input
          label='Новый чат'
          name='phone'
          onChange={event => setPhone(event.target.value)}
          placeholder='79991234567'
          value={phone}
        />
        <Button disabled={isLoading} type='submit'>
          {isLoading ? <Spinner /> : null}
          Создать
        </Button>
      </div>
      {error ? <p className={styles.error}>{error}</p> : null}
    </form>
  );
};
