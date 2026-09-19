import { TodoItem } from '@shared/types';
import { resolvePeriod } from './periods';
import {
  isPlannedIn,
  isDue,
  isCompleted,
  isUnfinished,
  isUnscheduled,
  isOverdue,
  isStale,
  overdueAgeInDays,
  categoryOf,
} from './taskClassification';

const ZONE = 'Europe/Berlin';

function todo(overrides: Partial<TodoItem> = {}): TodoItem {
  return {
    id: 't1',
    name: 'Task',
    status: 'pending',
    todolistId: null,
    order: 0,
    priority: 'medium',
    source: 'web',
    dueDate: null,
    ...overrides,
  };
}

describe('isPlannedIn', () => {
  it('is true when dueDate falls inside the period', () => {
    const now = new Date('2026-03-25T10:00:00.000Z');
    const period = resolvePeriod('week', now, ZONE, now);
    expect(
      isPlannedIn(todo({ dueDate: '2026-03-24T00:00:00.000Z' }), period)
    ).toBe(true);
  });

  it('is false for an unscheduled task', () => {
    const now = new Date('2026-03-25T10:00:00.000Z');
    const period = resolvePeriod('week', now, ZONE, now);
    expect(isPlannedIn(todo({ dueDate: null }), period)).toBe(false);
  });

  it('is false when the period has nothing due', () => {
    const now = new Date('2026-03-25T10:00:00.000Z');
    const period = resolvePeriod('week', now, ZONE, now);
    expect(
      isPlannedIn(todo({ dueDate: '2099-01-01T00:00:00.000Z' }), period)
    ).toBe(false);
  });
});

describe('isDue', () => {
  const now = new Date('2026-03-25T10:00:00.000Z');

  it('is true for a past due date', () => {
    expect(isDue(todo({ dueDate: '2026-03-20T00:00:00.000Z' }), now)).toBe(
      true
    );
  });

  it('is false for a future due date', () => {
    expect(isDue(todo({ dueDate: '2026-04-01T00:00:00.000Z' }), now)).toBe(
      false
    );
  });

  it('is false for an unscheduled task', () => {
    expect(isDue(todo({ dueDate: null }), now)).toBe(false);
  });
});

describe('completion and unfinished status', () => {
  it('treats successful as completed and everything else as unfinished', () => {
    expect(isCompleted(todo({ status: 'successful' }))).toBe(true);
    expect(isUnfinished(todo({ status: 'successful' }))).toBe(false);
    expect(isUnfinished(todo({ status: 'pending' }))).toBe(true);
    expect(isUnfinished(todo({ status: 'failed' }))).toBe(true);
  });
});

describe('isUnscheduled', () => {
  it('is true only when there is no due date', () => {
    expect(isUnscheduled(todo({ dueDate: null }))).toBe(true);
    expect(isUnscheduled(todo({ dueDate: '2026-01-01T00:00:00.000Z' }))).toBe(
      false
    );
  });
});

describe('overdueAgeInDays and isOverdue', () => {
  it('is zero and not overdue for a task due today', () => {
    const now = new Date('2026-03-25T10:00:00.000Z');
    const t = todo({ dueDate: '2026-03-25T02:00:00.000Z' });
    expect(overdueAgeInDays(t, now, ZONE)).toBe(0);
    expect(isOverdue(t, now, ZONE)).toBe(false);
  });

  it('counts days overdue for an unfinished past-due task', () => {
    const now = new Date('2026-03-25T10:00:00.000Z');
    const t = todo({ dueDate: '2026-03-20T02:00:00.000Z' });
    expect(overdueAgeInDays(t, now, ZONE)).toBe(5);
    expect(isOverdue(t, now, ZONE)).toBe(true);
  });

  it('is never overdue once completed, regardless of due date', () => {
    const now = new Date('2026-03-25T10:00:00.000Z');
    const t = todo({
      dueDate: '2026-03-01T00:00:00.000Z',
      status: 'successful',
    });
    expect(isOverdue(t, now, ZONE)).toBe(false);
  });

  it('is not overdue for an unscheduled task', () => {
    const now = new Date('2026-03-25T10:00:00.000Z');
    expect(isOverdue(todo({ dueDate: null }), now, ZONE)).toBe(false);
  });

  it('counts the calendar-day gap correctly across the Berlin spring DST transition', () => {
    // "now" (2026-03-29T22:30Z) is 2026-03-30 00:30 CEST in Berlin (after the
    // spring-forward), and the due date (2026-03-28T22:00Z) is 2026-03-28
    // 23:00 CET (before it) — a 2 calendar-day gap, not the 1-day gap a
    // fixed-offset (non-DST-aware) calculation would give.
    const now = new Date('2026-03-29T22:30:00.000Z');
    const t = todo({ dueDate: '2026-03-28T22:00:00.000Z' });
    expect(overdueAgeInDays(t, now, ZONE)).toBe(2);
  });
});

describe('isStale', () => {
  it('is not stale at exactly 7 days overdue', () => {
    const now = new Date('2026-03-25T10:00:00.000Z');
    expect(
      isStale(todo({ dueDate: '2026-03-18T02:00:00.000Z' }), now, ZONE)
    ).toBe(false);
  });

  it('is stale at more than 7 days overdue', () => {
    const now = new Date('2026-03-25T10:00:00.000Z');
    expect(
      isStale(todo({ dueDate: '2026-03-17T02:00:00.000Z' }), now, ZONE)
    ).toBe(true);
  });
});

describe('categoryOf', () => {
  it('resolves the parent list category', () => {
    const t = todo({ todolistId: 'list-1' });
    expect(categoryOf(t, { 'list-1': 'work' })).toBe('work');
  });

  it('is uncategorized for an inbox task', () => {
    const t = todo({ todolistId: null });
    expect(categoryOf(t, {})).toBe('uncategorized');
  });

  it('is uncategorized when the list id is unknown', () => {
    const t = todo({ todolistId: 'missing' });
    expect(categoryOf(t, {})).toBe('uncategorized');
  });
});
