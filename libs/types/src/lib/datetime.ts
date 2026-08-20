import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const DEFAULT_TIMEZONE = 'UTC';

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
