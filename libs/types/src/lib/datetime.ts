import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isoWeek from 'dayjs/plugin/isoWeek';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);

// The workspace TS lib target predates ES2022.Intl; `Intl.supportedValuesOf`
// is a real, widely-supported runtime API (Node 18+, all evergreen browsers).
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Intl {
    function supportedValuesOf(key: string): string[];
  }
}

export const DEFAULT_TIMEZONE = 'UTC';

/** Every IANA timezone identifier the current runtime knows about. */
export const ALL_TIMEZONES = Intl.supportedValuesOf('timeZone');

export type DateInput = Date | string | number | Dayjs;

/**
 * Timezone-aware date helpers shared by both applications.
 *
 * The backend runs in UTC, so any day boundary, greeting, or report schedule
 * derived from the server clock is wrong for every user outside it. These
 * helpers take an explicit IANA zone and return plain `Date` instants, which
 * is what MongoDB queries and Mongoose documents expect.
 */

export const isValidTimezone = (value: string): boolean => {
  if (!value) return false;

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
};

/** The browser or host timezone, falling back to UTC when unavailable. */
export const detectTimezone = (): string => {
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return detected && isValidTimezone(detected) ? detected : DEFAULT_TIMEZONE;
};

/** Reads an instant in the given zone. Unknown zones fall back to UTC. */
export const inZone = (value: DateInput, zone: string): Dayjs =>
  dayjs(value).tz(isValidTimezone(zone) ? zone : DEFAULT_TIMEZONE);

export const startOfDayInZone = (value: DateInput, zone: string): Date =>
  inZone(value, zone).startOf('day').toDate();

export const endOfDayInZone = (value: DateInput, zone: string): Date =>
  inZone(value, zone).endOf('day').toDate();

/** ISO week: Monday start. Used so a statistics/report "week" never depends
 * on the runtime's locale-default week start. */
export const startOfWeekInZone = (value: DateInput, zone: string): Date =>
  inZone(value, zone).startOf('isoWeek').toDate();

export const endOfWeekInZone = (value: DateInput, zone: string): Date =>
  inZone(value, zone).endOf('isoWeek').toDate();

export const startOfMonthInZone = (value: DateInput, zone: string): Date =>
  inZone(value, zone).startOf('month').toDate();

export const endOfMonthInZone = (value: DateInput, zone: string): Date =>
  inZone(value, zone).endOf('month').toDate();

export const startOfQuarterInZone = (value: DateInput, zone: string): Date =>
  inZone(value, zone).startOf('quarter').toDate();

export const endOfQuarterInZone = (value: DateInput, zone: string): Date =>
  inZone(value, zone).endOf('quarter').toDate();

export const startOfYearInZone = (value: DateInput, zone: string): Date =>
  inZone(value, zone).startOf('year').toDate();

export const endOfYearInZone = (value: DateInput, zone: string): Date =>
  inZone(value, zone).endOf('year').toDate();

/** The local hour (0-23) at the given instant, used for report scheduling. */
export const hourInZone = (value: DateInput, zone: string): number =>
  inZone(value, zone).hour();

/** Calendar day as `YYYY-MM-DD`, used to compare days across zones. */
export const dayKeyInZone = (value: DateInput, zone: string): string =>
  inZone(value, zone).format('YYYY-MM-DD');

export const isSameDayInZone = (
  left: DateInput,
  right: DateInput,
  zone: string
): boolean => dayKeyInZone(left, zone) === dayKeyInZone(right, zone);
