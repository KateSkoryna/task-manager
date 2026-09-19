import { TodoItem, inZone } from '@shared/types';
import { Period, bucketsFor } from './periods';
import { isDue, isCompleted } from './taskClassification';

export interface ConsistencyPoint {
  label: string;
  completionRatePercent: number | null;
}

export function completionRateTrend(
  todos: TodoItem[],
  period: Period,
  now: Date
): ConsistencyPoint[] {
  return bucketsFor(period).map((b) => {
    const inBucket = todos.filter((t) => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate).getTime();
      return d >= b.start.getTime() && d <= b.end.getTime();
    });
    const due = inBucket.filter((t) => isDue(t, now));
    const completed = due.filter(isCompleted);
    return {
      label: b.label,
      completionRatePercent:
        due.length > 0
          ? Math.round((completed.length / due.length) * 100)
          : null,
    };
  });
}

const MOSTLY_COMPLETED_THRESHOLD_PERCENT = 80;

/** Always computed at day granularity, regardless of the period's own bucket
 * kind (year buckets are months) — "days mostly completed" is a
 * daily-consistency metric. */
export function mostlyCompletedDaysCount(
  todos: TodoItem[],
  period: Period,
  now: Date
): number {
  let count = 0;
  let cursor = inZone(period.start, period.zone).startOf('day');
  const cutoff = inZone(period.cutoff, period.zone);
  let guard = 0;
  while (
    (cursor.isBefore(cutoff) || cursor.isSame(cutoff, 'day')) &&
    guard < 366
  ) {
    const dayStart = cursor.startOf('day').toDate().getTime();
    const dayEnd = cursor.endOf('day').toDate().getTime();
    const inDay = todos.filter((t) => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate).getTime();
      return d >= dayStart && d <= dayEnd;
    });
    const due = inDay.filter((t) => isDue(t, now));
    if (due.length > 0) {
      const completed = due.filter(isCompleted);
      if (
        (completed.length / due.length) * 100 >=
        MOSTLY_COMPLETED_THRESHOLD_PERCENT
      ) {
        count++;
      }
    }
    cursor = cursor.add(1, 'day');
    guard++;
  }
  return count;
}
