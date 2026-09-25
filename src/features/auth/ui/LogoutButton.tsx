import { Button } from '@/shared/ui/Button';

type LogoutButtonProps = {
  onLogout: () => void;
};

/** Кнопка выхода из сессии */
export const LogoutButton = ({ onLogout }: LogoutButtonProps) => (
  <Button onClick={onLogout} type='button' variant='ghost'>
    Выйти
  </Button>
);
