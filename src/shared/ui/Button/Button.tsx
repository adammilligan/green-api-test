import type { ButtonHTMLAttributes, ReactNode } from 'react';

import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
};

/** Кнопка UI-kit */
export const Button = ({
  children,
  variant = 'primary',
  className,
  type = 'button',
  ...rest
}: ButtonProps) => {
  const variantClass =
    variant === 'secondary'
      ? styles.secondary
      : variant === 'ghost'
        ? styles.ghost
        : '';

  return (
    <button
      className={[styles.button, variantClass, className]
        .filter(Boolean)
        .join(' ')}
      type={type}
      {...rest}
    >
      {children}
    </button>
  );
};
