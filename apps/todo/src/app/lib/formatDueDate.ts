import dayjs from 'dayjs';

type Translate = (key: string) => string;

function part(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes
): string {
  return parts.find((p) => p.type === type)?.value ?? '';
}

/**
 * A due date the way people say it: "Today", "Tomorrow", a short weekday for
 * the next week, then "24 Oct", and "24 Oct 2025" outside the current year.
 * The day always comes before the month, as in the header date.
 */
export function formatDueDate(
  dueDate: string,
  now: Date,
  locale: string,
  t: Translate
): string {
  const due = dayjs(dueDate).startOf('day');
  const days = due.diff(dayjs(now).startOf('day'), 'day');
  if (days === 0) return t('tasks.dueToday');
  if (days === 1) return t('tasks.dueTomorrow');
  if (days >= 2 && days <= 6) {
    return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(
      due.toDate()
    );
  }
  const sameYear = due.year() === dayjs(now).year();
  const parts = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  }).formatToParts(due.toDate());
  const dayAndMonth = `${part(parts, 'day')} ${part(parts, 'month')}`;
  return sameYear ? dayAndMonth : `${dayAndMonth} ${part(parts, 'year')}`;
}
