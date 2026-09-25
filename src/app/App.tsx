import { useCallback, useState } from 'react';

import {
  clearSession,
  loadSession,
  saveSession,
  type SessionCredentials
} from '@/entities/session';
import { ChatPage } from '@/pages/chat';
import { LoginPage } from '@/pages/login';

/** Корневой компонент приложения */
const App = () => {
  const [session, setSession] = useState<SessionCredentials | null>(() =>
    loadSession()
  );

  /**
   * Сохраняет сессию и открывает чат.
   */
  const handleLogin = useCallback((credentials: SessionCredentials) => {
    saveSession(credentials);
    setSession(credentials);
  }, []);

  /**
   * Выход из сессии.
   */
  const handleLogout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  if (!session) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <ChatPage credentials={session} onLogout={handleLogout} />;
};

export default App;
