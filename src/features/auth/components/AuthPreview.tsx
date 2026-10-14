import type { JSX } from 'react';
import { useI18n } from '../../../lib/i18n/I18nProvider';
import styles from './AuthPreview.module.css';

/**
 * A small, made-up day that shows what the planner looks like. It is
 * decoration, so assistive technology skips it; the text beside it says the same.
 */
export function AuthPreview(): JSX.Element {
  const { t } = useI18n();

  return (
    <div className={styles.preview} aria-hidden="true">
      <p className={styles.day}>{t('auth.preview.day')}</p>
      <ul className={styles.blocks}>
        <li data-calendar-color="blue" style={{ '--row': 1, '--span': 1 }}>
          <strong>{t('auth.preview.standUp')}</strong> 09:00
        </li>
        <li data-calendar-color="green" style={{ '--row': 2, '--span': 2 }}>
          <strong>{t('auth.preview.checklist')}</strong> 09:30
        </li>
        <li data-calendar-color="peach" style={{ '--row': 5, '--span': 1 }}>
          <strong>{t('auth.preview.lunch')}</strong> 13:00
        </li>
      </ul>
      <p className={styles.task}>{t('auth.preview.task')}</p>
    </div>
  );
}
