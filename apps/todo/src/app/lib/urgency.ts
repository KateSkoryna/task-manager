import dayjs from 'dayjs';

// Due dates are stored without a time of day, so the deadline is treated as
// the end of the due date rather than midnight at its start.
export function isDueWithinHours(
  dueDate: string | null | undefined,
  hours = 4,
  now: dayjs.Dayjs = dayjs()
): boolean {
  if (!dueDate) return false;
  const due = dayjs(dueDate);
  if (!due.isValid()) return false;
  const hoursUntilDue = due.endOf('day').diff(now, 'hour', true);
  return hoursUntilDue >= 0 && hoursUntilDue <= hours;
}
