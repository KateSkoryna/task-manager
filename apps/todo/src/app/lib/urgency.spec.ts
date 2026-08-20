import dayjs from 'dayjs';
import { isDueWithinHours } from './urgency';

describe('isDueWithinHours', () => {
  // Due dates carry no time of day, so the deadline is end-of-day.
  const now = dayjs('2026-08-18 20:30:00');

  test('returns false when there is no due date', () => {
    expect(isDueWithinHours(null, 4, now)).toBe(false);
    expect(isDueWithinHours(undefined, 4, now)).toBe(false);
  });

  test('returns false for an invalid due date', () => {
    expect(isDueWithinHours('not-a-date', 4, now)).toBe(false);
  });

  test('returns true when due today and within the window before midnight', () => {
    // 20:30 -> end of day is 23:59:59.999, ~3.5 hours away
    expect(isDueWithinHours('2026-08-18', 4, now)).toBe(true);
  });

  test('returns false when due today but still more than the window away', () => {
    const earlyEvening = dayjs('2026-08-18 12:00:00');
    expect(isDueWithinHours('2026-08-18', 4, earlyEvening)).toBe(false);
  });

  test('returns false when due date is in the future', () => {
    expect(isDueWithinHours('2026-08-19', 4, now)).toBe(false);
  });

  test('returns false when due date has already passed', () => {
    expect(isDueWithinHours('2026-08-17', 4, now)).toBe(false);
  });
});
