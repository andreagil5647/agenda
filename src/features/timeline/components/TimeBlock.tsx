import { useDraggable } from '@dnd-kit/core';
import { useState, type JSX, type KeyboardEvent, type PointerEvent } from 'react';
import type { Calendar, PlannerEvent } from '../../../lib/api/contract';
import { useI18n } from '../../../lib/i18n/I18nProvider';
import { formatTimeRange, type HourCycle } from '../../../lib/time/formatTime';
import controls from '../../../ui/controls.module.css';
import {
  GRID_STEP_MINUTES,
  minutesAtOffset,
  movedBy,
  resizedBy,
  type PlacedBlock,
  type TimeSpan,
} from '../dayLayout';
import { draggedBlock } from '../planningDrag';
import type { Arrival } from '../hooks/useBlockMotion';
import { isProvisional } from '../provisionalEvent';
import styles from './TimeBlock.module.css';

/** Below this length a block has room for one line only. */
const SHORT_BLOCK_MINUTES = 45;

/** The id of the text that explains the block shortcuts, rendered once by the grid. */
export const BLOCK_SHORTCUTS_ID = 'block-shortcuts';

interface BlockFaceProps {
  event: PlannerEvent;
  calendar: Calendar | undefined;
  span: TimeSpan;
  hourCycle: HourCycle;
}

/** What a block says: its title and times, and which calendar it is in, for those who cannot see its colour. */
function BlockFace({ event, calendar, span, hourCycle }: BlockFaceProps): JSX.Element {
  const { locale } = useI18n();

  return (
    <>
      <strong className={styles.title}>{event.title}</strong>{' '}
      <span className={styles.time}>
        {formatTimeRange(span.startMinutes, span.endMinutes, hourCycle, locale)}
      </span>
      {/* Part of the block's accessible name, not of its face. */}
      {calendar && <span className={controls.visuallyHidden}>{calendar.name}</span>}
    </>
  );
}

interface TimeBlockProps {
  block: PlacedBlock;
  calendar: Calendar | undefined;
  hourCycle: HourCycle;
  isSelected: boolean;
  /** Set while the block is arriving because of something the reader did. */
  arrival: Arrival | undefined;
  /** Called when its arrival has finished. */
  onArrived: () => void;
  onSelect: (event: PlannerEvent) => void;
  /** Moves the block, keeping its length. */
  onMove: (event: PlannerEvent, span: TimeSpan) => void;
  /** Changes when the block ends. */
  onResize: (event: PlannerEvent, span: TimeSpan) => void;
  onDelete: (event: PlannerEvent) => void;
}

/**
 * One block on the day grid, placed by its times and by its column among
 * overlapping blocks.
 *
 * With a pointer it is dragged to move and pulled by its bottom edge to
 * resize. From the keyboard the arrow keys move it by one grid step, Shift
 * with an arrow key changes its length, and Delete removes it.
 */
export function TimeBlock({
  block,
  calendar,
  hourCycle,
  isSelected,
  arrival,
  onArrived,
  onSelect,
  onMove,
  onResize,
  onDelete,
}: TimeBlockProps): JSX.Element {
  const { event, column, columns } = block;
  // The end while the edge is being pulled, before it is saved.
  const [pulledEnd, setPulledEnd] = useState<number | null>(null);
  const span: TimeSpan = {
    startMinutes: block.startMinutes,
    endMinutes: pulledEnd ?? block.endMinutes,
  };

  // A block still being saved has no version to base a change on, and a block
  // cut at midnight shows only part of an event, so neither can be rescheduled here.
  const isSaving = isProvisional(event);
  const canReschedule = !isSaving && !block.isClipped;
  const { setNodeRef, listeners, isDragging } = useDraggable({
    id: `block:${event.id}`,
    data: draggedBlock(block),
    disabled: !canReschedule,
  });

  const rescheduleWithKeys = (keyEvent: KeyboardEvent<HTMLButtonElement>): void => {
    if (keyEvent.key === 'Delete' || keyEvent.key === 'Backspace') {
      keyEvent.preventDefault();
      onDelete(event);
      return;
    }
    if (!canReschedule || (keyEvent.key !== 'ArrowUp' && keyEvent.key !== 'ArrowDown')) return;

    // Without this the arrow keys would scroll the grid as well.
    keyEvent.preventDefault();
    const step = keyEvent.key === 'ArrowUp' ? -GRID_STEP_MINUTES : GRID_STEP_MINUTES;
    if (keyEvent.shiftKey) {
      onResize(event, resizedBy(block, step));
    } else {
      onMove(event, movedBy(block, step));
    }
  };

  const startPulling = (pointerEvent: PointerEvent<HTMLSpanElement>): void => {
    pointerEvent.preventDefault();
    const handle = pointerEvent.currentTarget;
    const columnHeight = handle.closest('ol')?.getBoundingClientRect().height ?? 0;
    const startY = pointerEvent.clientY;
    let end = block.endMinutes;

    const pull = (moveEvent: globalThis.PointerEvent): void => {
      const delta = minutesAtOffset(moveEvent.clientY - startY, columnHeight);
      end = resizedBy(block, delta).endMinutes;
      setPulledEnd(end);
    };
    const release = (): void => {
      handle.removeEventListener('pointermove', pull);
      setPulledEnd(null);
      if (end !== block.endMinutes) {
        onResize(event, { startMinutes: block.startMinutes, endMinutes: end });
      }
    };

    // Capturing keeps the moves coming to the handle even when the pointer leaves it.
    handle.setPointerCapture(pointerEvent.pointerId);
    handle.addEventListener('pointermove', pull);
    handle.addEventListener('pointerup', release, { once: true });
    handle.addEventListener('pointercancel', release, { once: true });
  };

  return (
    <li
      className={styles.block}
      data-calendar-color={calendar?.colorKey}
      data-short={span.endMinutes - span.startMinutes < SHORT_BLOCK_MINUTES}
      data-dragging={isDragging}
      data-arrival={arrival}
      onAnimationEnd={(animationEvent) => {
        if (animationEvent.target === animationEvent.currentTarget) onArrived();
      }}
      style={{
        '--start': span.startMinutes,
        '--end': span.endMinutes,
        '--column': column,
        '--columns': columns,
      }}
    >
      <button
        ref={setNodeRef}
        type="button"
        className={styles.body}
        aria-pressed={isSelected}
        aria-busy={isSaving}
        aria-describedby={BLOCK_SHORTCUTS_ID}
        disabled={isSaving}
        onClick={() => {
          onSelect(event);
        }}
        onKeyDown={rescheduleWithKeys}
        {...listeners}
      >
        <BlockFace event={event} calendar={calendar} span={span} hourCycle={hourCycle} />
      </button>
      {canReschedule && (
        // A pointer-only shortcut; Shift with the arrow keys does the same.
        <span className={styles.resizeHandle} aria-hidden="true" onPointerDown={startPulling} />
      )}
    </li>
  );
}

interface LeavingBlockProps {
  block: PlacedBlock;
  calendar: Calendar | undefined;
  hourCycle: HourCycle;
  /** Called when it has finished leaving. */
  onGone: () => void;
}

/**
 * A block the reader has just deleted, kept on screen for a moment to shrink away. It is only a
 * picture of what was there: it cannot be reached, and assistive technology skips it, since the
 * block is already gone and has been announced as deleted.
 */
export function LeavingBlock({
  block,
  calendar,
  hourCycle,
  onGone,
}: LeavingBlockProps): JSX.Element {
  const { event, column, columns } = block;
  const span: TimeSpan = { startMinutes: block.startMinutes, endMinutes: block.endMinutes };

  return (
    <li
      className={`${styles.block} ${styles.leaving}`}
      aria-hidden="true"
      data-leaving
      data-calendar-color={calendar?.colorKey}
      data-short={span.endMinutes - span.startMinutes < SHORT_BLOCK_MINUTES}
      onAnimationEnd={(animationEvent) => {
        if (animationEvent.target === animationEvent.currentTarget) onGone();
      }}
      style={{
        '--start': span.startMinutes,
        '--end': span.endMinutes,
        '--column': column,
        '--columns': columns,
      }}
    >
      <div className={styles.body}>
        <BlockFace event={event} calendar={calendar} span={span} hourCycle={hourCycle} />
      </div>
    </li>
  );
}
