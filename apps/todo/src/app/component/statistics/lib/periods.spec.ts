import {
  resolvePeriod,
  shiftPeriod,
  previousComparableSpan,
  bucketsFor,
} from './periods';

const ZONE = 'Europe/Berlin';

describe('resolvePeriod', () => {
  it('resolves a full week and caps cutoff at now for the current partial week', () => {
    const now = new Date('2026-03-25T10:00:00.000Z'); // Wednesday
    const period = resolvePeriod('week', now, ZONE, now);

    expect(period.start.toISOString()).toBe('2026-03-22T23:00:00.000Z');
    expect(period.cutoff).toEqual(now);
    expect(period.cutoff.getTime()).toBeLessThan(period.end.getTime());
  });

  it('caps cutoff at end for a fully elapsed past period', () => {
    const now = new Date('2026-05-01T00:00:00.000Z');
    const period = resolvePeriod(
      'month',
      '2026-03-15T00:00:00.000Z',
      ZONE,
      now
    );

    expect(period.cutoff).toEqual(period.end);
  });

  it('spans a 23-hour week across the Berlin spring DST transition', () => {
    const now = new Date('2026-03-25T10:00:00.000Z');
    const period = resolvePeriod('week', now, ZONE, now);
    const hours =
      (period.end.getTime() - period.start.getTime() + 1) / 3_600_000;

    expect(hours).toBe(7 * 24 - 1);
  });
});

describe('shiftPeriod', () => {
  it('moves a week period back by exactly one week', () => {
    const now = new Date('2026-03-25T10:00:00.000Z');
    const period = resolvePeriod('week', now, ZONE, now);
    const previous = shiftPeriod(period, -1, now);

    expect(previous.start.toISOString()).toBe('2026-03-15T23:00:00.000Z');
    expect(previous.kind).toBe('week');
  });

  it('moves a year period back by exactly one year', () => {
    const now = new Date('2026-06-01T00:00:00.000Z');
    const period = resolvePeriod('year', now, ZONE, now);
    const previous = shiftPeriod(period, -1, now);

    expect(previous.start.getUTCFullYear()).toBe(
      period.start.getUTCFullYear() - 1
    );
  });
});

describe('previousComparableSpan', () => {
  it('compares only the elapsed portion of a partial current period', () => {
    // Wednesday, 2 days into the week (Mon start).
    const now = new Date('2026-03-25T10:00:00.000Z');
    const period = resolvePeriod('week', now, ZONE, now);
    const span = previousComparableSpan(period);
    const elapsedMs = period.cutoff.getTime() - period.start.getTime();

    expect(span.end.getTime() - span.start.getTime()).toBe(elapsedMs);
  });

  it('compares the full previous period when the current period has fully elapsed', () => {
    const now = new Date('2026-05-01T00:00:00.000Z');
    const period = resolvePeriod(
      'month',
      '2026-03-15T00:00:00.000Z',
      ZONE,
      now
    );
    const previous = shiftPeriod(period, -1, now);
    const span = previousComparableSpan(period);

    expect(span.start).toEqual(previous.start);
    expect(span.end).toEqual(previous.end);
  });
});

describe('bucketsFor', () => {
  it('produces 7 day buckets for a week', () => {
    const now = new Date('2026-03-25T10:00:00.000Z');
    const period = resolvePeriod('week', now, ZONE, now);

    expect(bucketsFor(period)).toHaveLength(7);
  });

  it('produces 12 month buckets for a year', () => {
    const now = new Date('2026-06-01T00:00:00.000Z');
    const period = resolvePeriod('year', now, ZONE, now);
    const buckets = bucketsFor(period);

    expect(buckets).toHaveLength(12);
    expect(buckets[0].label).toBe('Jan');
    expect(buckets[11].label).toBe('Dec');
  });

  it('produces one bucket per day of the month', () => {
    const now = new Date('2026-04-15T00:00:00.000Z');
    const period = resolvePeriod('month', now, ZONE, now);

    expect(bucketsFor(period)).toHaveLength(30);
  });
});
