import styles from './Spinner.module.css';

type SpinnerProps = {
  dark?: boolean;
};

/** Индикатор загрузки */
export const Spinner = ({ dark = false }: SpinnerProps) => (
  <span
    aria-hidden
    className={[styles.spinner, dark ? styles.dark : '']
      .filter(Boolean)
      .join(' ')}
  />
);
