import type { JSX } from 'react';
import { useI18n } from '../../../lib/i18n/I18nProvider';
import { formatDayHeading } from '../../../lib/time/formatTime';
import controls from '../../../ui/controls.module.css';
import { Icon } from '../../../ui/Icon';
import styles from './DayHeader.module.css';

interface DayHeaderProps {
  day: string;
  isToday: boolean;
  onShowDay: (day: string) => void;
  onShowToday: () => void;
  onShowPrevious: () => void;
  onShowNext: () => void;
}

/** Names the day on screen and moves between days. */
export function DayHeader({
  day,
  isToday,
  onShowDay,
  onShowToday,
  onShowPrevious,
  onShowNext,
}: DayHeaderProps): JSX.Element {
  const { t, locale } = useI18n();

  return (
    <header className={styles.header}>
      <div className={styles.title}>
        <h1 className={styles.heading}>{formatDayHeading(day, locale)}</h1>
        {isToday && <p className={styles.today}>{t('timeline.date.today')}</p>}
      </div>
      <div className={styles.controls}>
        <button
          type="button"
          className={`${controls.iconAction} ${controls.navAction}`}
          aria-label={t('timeline.date.previous')}
          onClick={onShowPrevious}
        >
          <Icon name="chevron-left" />
        </button>
        <button
          type="button"
          className={controls.secondaryAction}
          disabled={isToday}
          onClick={onShowToday}
        >
          {t('timeline.date.today')}
        </button>
        <button
          type="button"
          className={`${controls.iconAction} ${controls.navAction}`}
          aria-label={t('timeline.date.next')}
          onClick={onShowNext}
        >
          <Icon name="chevron-right" />
        </button>
        <input
          type="date"
          className={styles.datePicker}
          aria-label={t('timeline.date.goTo')}
          value={day}
          onChange={(event) => {
            if (event.target.value) onShowDay(event.target.value);
          }}
        />
      </div>
    </header>
  );
}
