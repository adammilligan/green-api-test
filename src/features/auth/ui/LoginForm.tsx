import { FormEvent, useState } from 'react';

import type { SessionCredentials } from '@/entities/session';
import { resolveApiUrl } from '@/shared/config/greenApi';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Spinner } from '@/shared/ui/Spinner';

import styles from './LoginForm.module.css';

type LoginFormProps = {
  onSubmit: (credentials: SessionCredentials) => void;
};

/** Форма входа по учётным данным GREEN-API */
export const LoginForm = ({ onSubmit }: LoginFormProps) => {
  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiTokenInstance] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Обрабатывает отправку формы логина.
   */
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedId = idInstance.trim();
    const trimmedToken = apiTokenInstance.trim();

    if (!trimmedId || !trimmedToken) {
      setError('Укажите idInstance и apiTokenInstance');
      return;
    }

    setIsSubmitting(true);
    onSubmit({
      idInstance: trimmedId,
      apiTokenInstance: trimmedToken,
      apiUrl: resolveApiUrl({ idInstance: trimmedId, apiUrl })
    });
    setIsSubmitting(false);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <Input
        autoComplete='off'
        label='idInstance'
        name='idInstance'
        onChange={event => setIdInstance(event.target.value)}
        placeholder='410022745861'
        required
        value={idInstance}
      />
      <Input
        autoComplete='off'
        label='apiTokenInstance'
        name='apiTokenInstance'
        onChange={event => setApiTokenInstance(event.target.value)}
        placeholder='токен из личного кабинета'
        required
        value={apiTokenInstance}
      />
      <Input
        autoComplete='off'
        label='apiUrl (если пусто — по idInstance)'
        name='apiUrl'
        onChange={event => setApiUrl(event.target.value)}
        placeholder='https://4100.api.green-api.com'
        value={apiUrl}
      />
      <p className={styles.hint}>
        Для инстанса 4100… apiUrl обычно https://4100.api.green-api.com (с
        карточки в кабинете GREEN-API).
      </p>
      {error ? <p className={styles.error}>{error}</p> : null}
      <div className={styles.actions}>
        <Button disabled={isSubmitting} type='submit'>
          {isSubmitting ? <Spinner /> : null}
          Войти
        </Button>
      </div>
    </form>
  );
};
