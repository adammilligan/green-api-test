import type { InputHTMLAttributes } from 'react';

import styles from './Input.module.css';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

/** Текстовое поле UI-kit */
export const Input = ({ label, id, className, ...rest }: InputProps) => {
  const inputId = id ?? rest.name;

  return (
    <label className={styles.field} htmlFor={inputId}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <input
        className={[styles.input, className].filter(Boolean).join(' ')}
        id={inputId}
        {...rest}
      />
    </label>
  );
};
