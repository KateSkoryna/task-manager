import { TodoItem } from '@shared/types';
import { resolvePeriod } from './periods';
import { completionRateTrend, mostlyCompletedDaysCount } from './consistency';

const ZONE = 'Europe/Berlin';
const NOW = new Date('2026-03-25T10:00:00.000Z');

function todo(overrides: Partial<TodoItem> = {}): TodoItem {
  return {
    id: overrides.id ?? Math.random().toString(),
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

describe('completionRateTrend', () => {
  const period = resolvePeriod('week', NOW, ZONE, NOW);

  it('computes a completion rate per bucket', () => {
    const todos = [
      todo({ dueDate: '2026-03-23T00:00:00.000Z', status: 'successful' }),
      todo({ dueDate: '2026-03-23T00:00:00.000Z', status: 'pending' }),
    ];
    const trend = completionRateTrend(todos, period, NOW);
    const monday = trend.find((p) => p.label === 'Mon');
    expect(monday?.completionRatePercent).toBe(50);
  });

  it('is null for buckets with nothing due', () => {
    const trend = completionRateTrend([], period, NOW);
    expect(trend.every((p) => p.completionRatePercent === null)).toBe(true);
  });
});

describe('mostlyCompletedDaysCount', () => {
  const period = resolvePeriod('week', NOW, ZONE, NOW);

  it('counts days where at least 80% of due tasks were completed', () => {
    const todos = [
      // Monday: 4/5 completed = 80% -> counts.
      todo({ dueDate: '2026-03-23T08:00:00.000Z', status: 'successful' }),
      todo({ dueDate: '2026-03-23T08:00:00.000Z', status: 'successful' }),
      todo({ dueDate: '2026-03-23T08:00:00.000Z', status: 'successful' }),
      todo({ dueDate: '2026-03-23T08:00:00.000Z', status: 'successful' }),
      todo({ dueDate: '2026-03-23T08:00:00.000Z', status: 'pending' }),
      // Tuesday: 1/2 completed = 50% -> does not count.
      todo({ dueDate: '2026-03-24T08:00:00.000Z', status: 'successful' }),
      todo({ dueDate: '2026-03-24T08:00:00.000Z', status: 'pending' }),
    ];
    expect(mostlyCompletedDaysCount(todos, period, NOW)).toBe(1);
  });

  it('is zero for an empty period', () => {
    expect(mostlyCompletedDaysCount([], period, NOW)).toBe(0);
  });

  it('only counts days up to the period cutoff, not the full future week', () => {
    // NOW is Wednesday; days after it (planned in the future) should not be evaluated.
    const todos = [
      todo({ dueDate: '2026-03-27T08:00:00.000Z', status: 'successful' }),
    ];
    expect(mostlyCompletedDaysCount(todos, period, NOW)).toBe(0);
  });
});
