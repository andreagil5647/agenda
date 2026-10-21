import { useEffect, useRef, useState, type JSX, type SyntheticEvent } from 'react';
import type { Calendar, PatchEventRequest, PlannerEvent, Task } from '../../../lib/api/contract';
import { readField } from '../../../lib/forms';
import { useI18n } from '../../../lib/i18n/I18nProvider';
import { formatTimeInputValue, parseTimeOfDay } from '../../../lib/time/formatTime';
import { instantAt, localDateOf, minutesOfDay, MINUTES_PER_DAY } from '../../../lib/time/zonedTime';
import controls from '../../../ui/controls.module.css';
import { Panel } from '../../../ui/Panel';
import { useUpdateEvent } from '../hooks/useEvents';
import styles from './BlockEditor.module.css';

interface BlockEditorProps {
  event: PlannerEvent;
  calendars: Calendar[];
  /** The task this block is time set aside for, if any. */
  linkedTask: Task | undefined;
  timeZone: string;
  /** Deletes the event, the way the planner does it everywhere. */
  onDelete: (event: PlannerEvent) => void;
  onClose: () => void;
}

/** The value a time input shows for an instant, on the wall clock of `timeZone`. */
function timeInputValue(instant: string | null, timeZone: string): string {
  return instant ? formatTimeInputValue(minutesOfDay(new Date(instant), timeZone)) : '';
}

/**
 * The new start and end of a timed event from its time inputs, kept on the
 * date the event starts on. An end of 00:00 means the end of that day.
 */
function readTimes(
  form: FormData,
  event: PlannerEvent,
  timeZone: string,
): Pick<PatchEventRequest, 'startUtc' | 'endUtc'> | null {
  const start = parseTimeOfDay(readField(form, 'start'));
  const rawEnd = parseTimeOfDay(readField(form, 'end'));
  if (start === null || rawEnd === null || !event.startUtc) return null;

  const end = rawEnd === 0 ? MINUTES_PER_DAY : rawEnd;
  if (end <= start) return null;

  const day = localDateOf(new Date(event.startUtc), timeZone);
  return {
    startUtc: instantAt(day, start, timeZone).toISOString(),
    endUtc: instantAt(day, end, timeZone).toISOString(),
  };
}

/** Edits the block that is selected on the timeline: its title, calendar and times. */
export function BlockEditor({
  event,
  calendars,
  linkedTask,
  timeZone,
  onDelete,
  onClose,
}: BlockEditorProps): JSX.Element {
  const updateEvent = useUpdateEvent();
  const { t } = useI18n();
  const [hasTimeProblem, setHasTimeProblem] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const isTimed = event.kind === 'timed';

  // Selecting a block moves the keyboard to its title, ready to be retyped.
  useEffect(() => {
    titleRef.current?.focus();
    titleRef.current?.select();
  }, [event.id]);

  const save = (submitEvent: SyntheticEvent<HTMLFormElement>): void => {
    submitEvent.preventDefault();
    const form = new FormData(submitEvent.currentTarget);
    const times = isTimed ? readTimes(form, event, timeZone) : {};
    if (times === null) {
      setHasTimeProblem(true);
      return;
    }

    setHasTimeProblem(false);
    updateEvent.mutate({
      event,
      changes: {
        title: readField(form, 'title').trim(),
        calendarId: readField(form, 'calendarId'),
        ...times,
      },
    });
  };

  const remove = (): void => {
    onDelete(event);
    onClose();
  };

  return (
    <Panel
      title={t('block.details')}
      icon="sparkle"
      aside={
        <button type="button" className={controls.secondaryAction} onClick={onClose}>
          {t('block.close')}
        </button>
      }
    >
      {/* Keyed by version: when the block changes elsewhere, the fields show the new values. */}
      <form
        key={`${event.id}:${String(event.version)}`}
        className={styles.form}
        autoComplete="off"
        onSubmit={save}
      >
        <label>
          {t('block.title')}
          <input ref={titleRef} name="title" defaultValue={event.title} maxLength={160} required />
        </label>
        <label>
          {t('block.calendar')}
          <select name="calendarId" defaultValue={event.calendarId}>
            {calendars.map((calendar) => (
              <option value={calendar.id} key={calendar.id}>
                {calendar.name}
              </option>
            ))}
          </select>
        </label>
        {isTimed && (
          <div className={styles.times}>
            <label>
              {t('block.start')}
              <input
                name="start"
                type="time"
                step={300}
                defaultValue={timeInputValue(event.startUtc, timeZone)}
                required
              />
            </label>
            <label>
              {t('block.end')}
              <input
                name="end"
                type="time"
                step={300}
                defaultValue={timeInputValue(event.endUtc, timeZone)}
                required
              />
            </label>
          </div>
        )}
        {linkedTask && (
          <p className={styles.link}>{t('block.linkedTask', { title: linkedTask.title })}</p>
        )}
        {hasTimeProblem && (
          <p className={controls.formError} role="alert">
            {t('block.endAfterStart')}
          </p>
        )}
        <div className={styles.actions}>
          <button type="submit" className={controls.primaryAction}>
            {t('block.save')}
          </button>
          <button type="button" className={controls.secondaryAction} onClick={remove}>
            {t('block.delete')}
          </button>
        </div>
      </form>
    </Panel>
  );
}
