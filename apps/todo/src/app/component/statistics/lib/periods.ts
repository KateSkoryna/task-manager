import {
  DateInput,
  inZone,
  startOfWeekInZone,
  endOfWeekInZone,
  startOfMonthInZone,
  endOfMonthInZone,
  startOfYearInZone,
  endOfYearInZone,
} from '@shared/types';

export type PeriodKind = 'week' | 'month' | 'year';

export interface Period {
  kind: PeriodKind;
  zone: string;
  start: Date;
  end: Date;
  /** The earlier of `end` and now — the part of the period that has actually elapsed. */
  cutoff: Date;
}

export interface Bucket {
  label: string;
  start: Date;
  end: Date;
}

function boundsFor(
  kind: PeriodKind,
  anchor: DateInput,
  zone: string
): { start: Date; end: Date } {
  if (kind === 'week') {
    return {
      start: startOfWeekInZone(anchor, zone),
      end: endOfWeekInZone(anchor, zone),
    };
  }
  if (kind === 'month') {
    return {
      start: startOfMonthInZone(anchor, zone),
      end: endOfMonthInZone(anchor, zone),
    };
  }
  return {
    start: startOfYearInZone(anchor, zone),
    end: endOfYearInZone(anchor, zone),
  };
}

export function resolvePeriod(
  kind: PeriodKind,
  anchor: DateInput,
  zone: string,
  now: Date = new Date()
): Period {
  const { start, end } = boundsFor(kind, anchor, zone);
  const cutoff = now.getTime() < end.getTime() ? now : end;
  return { kind, zone, start, end, cutoff };
}

export function shiftPeriod(
  period: Period,
  delta: -1 | 1,
  now: Date = new Date()
): Period {
  const unit = period.kind;
  const anchor = inZone(period.start, period.zone).add(delta, unit).toDate();
  return resolvePeriod(period.kind, anchor, period.zone, now);
}

/**
 * The previous period's span comparable to how much of `period` has actually
 * elapsed. A partial current period (e.g. Mon-Wed so far) compares against
 * the same Mon-Wed span last period, not the full previous period.
 */
export function previousComparableSpan(period: Period): {
  start: Date;
  end: Date;
} {
  const previous = shiftPeriod(period, -1, period.cutoff);
  const elapsedMs = period.cutoff.getTime() - period.start.getTime();
  const end = new Date(
    Math.min(previous.start.getTime() + elapsedMs, previous.end.getTime())
  );
  return { start: previous.start, end };
}

/** Day buckets for week/month, month buckets for year. */
export function bucketsFor(period: Period): Bucket[] {
  const buckets: Bucket[] = [];

  if (period.kind === 'year') {
    let cursor = inZone(period.start, period.zone).startOf('month');
    for (let i = 0; i < 12; i++) {
      buckets.push({
        label: cursor.format('MMM'),
        start: cursor.startOf('month').toDate(),
        end: cursor.endOf('month').toDate(),
      });
      cursor = cursor.add(1, 'month');
    }
    return buckets;
  }

  let cursor = inZone(period.start, period.zone).startOf('day');
  const end = inZone(period.end, period.zone);
  let guard = 0;
  while ((cursor.isBefore(end) || cursor.isSame(end, 'day')) && guard < 31) {
    buckets.push({
      label: cursor.format(period.kind === 'week' ? 'ddd' : 'D'),
      start: cursor.startOf('day').toDate(),
      end: cursor.endOf('day').toDate(),
    });
    cursor = cursor.add(1, 'day');
    guard++;
  }
  return buckets;
}

export const dayjsInPeriodZone = (value: DateInput, period: Period) =>
  inZone(value, period.zone);
