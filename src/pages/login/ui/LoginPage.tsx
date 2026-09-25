import type { SessionCredentials } from '@/entities/session';
import { LoginForm } from '@/features/auth';

import styles from './LoginPage.module.css';

type LoginPageProps = {
  onLogin: (credentials: SessionCredentials) => void;
};

/** Страница входа */
export const LoginPage = ({ onLogin }: LoginPageProps) => (
  <div className={styles.page}>
    <div className={styles.card}>
      <h1 className={styles.brand}>Telegram</h1>
      <p className={styles.subtitle}>
        Введите учётные данные инстанса GREEN-API, чтобы отправлять и получать
        текстовые сообщения в Telegram.
      </p>
      <LoginForm onSubmit={onLogin} />
    </div>
  </div>
);
