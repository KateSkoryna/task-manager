import { formatDueDate } from './formatDueDate';

const t = (key: string) => key;
const now = new Date(2026, 9, 12, 15, 0);

describe('formatDueDate', () => {
  test('says today', () => {
    expect(formatDueDate('2026-10-12', now, 'en-US', t)).toBe('tasks.dueToday');
  });
  test('says tomorrow', () => {
    expect(formatDueDate('2026-10-13', now, 'en-US', t)).toBe(
      'tasks.dueTomorrow'
    );
  });
  test('uses a short weekday 3 days ahead', () => {
    expect(formatDueDate('2026-10-15', now, 'en-US', t)).toBe('Thu');
  });
  test('uses day and month 30 days ahead', () => {
    expect(formatDueDate('2026-11-11', now, 'en-US', t)).toBe('11 Nov');
  });
  test('adds the year for last year', () => {
    expect(formatDueDate('2025-10-12', now, 'en-US', t)).toBe('12 Oct 2025');
  });
  test('translates the weekday', () => {
    expect(formatDueDate('2026-10-15', now, 'de-DE', t)).toBe('Do');
  });
});
