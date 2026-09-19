import { TodoItem } from '@shared/types';
import { resolvePeriod } from './periods';
import {
  completionRate,
  completedVsPlanned,
  unfinishedOverdue,
  planningLoad,
  workloadDistribution,
  plannedVsCompletedSeries,
} from './planning';

const ZONE = 'Europe/Berlin';
const NOW = new Date('2026-03-25T10:00:00.000Z'); // Wednesday, mid-week

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

describe('completionRate', () => {
  const period = resolvePeriod('week', NOW, ZONE, NOW);

  it('computes the rate from due tasks in the period', () => {
    const todos = [
      todo({ dueDate: '2026-03-23T00:00:00.000Z', status: 'successful' }),
      todo({ dueDate: '2026-03-24T00:00:00.000Z', status: 'pending' }),
    ];
    const result = completionRate(todos, period, NOW);
    expect(result).toEqual({ rate: 50, completedCount: 1, dueCount: 2 });
  });

  it('returns null, not 0, when nothing was due', () => {
    const result = completionRate([], period, NOW);
    expect(result.rate).toBeNull();
  });

  it('ignores tasks outside the period', () => {
    const todos = [todo({ dueDate: '2099-01-01T00:00:00.000Z' })];
    const result = completionRate(todos, period, NOW);
    expect(result.dueCount).toBe(0);
    expect(result.rate).toBeNull();
  });

  it('excludes future-dated tasks (planned but not yet due) from the denominator', () => {
    const todos = [
      todo({ dueDate: '2026-03-23T00:00:00.000Z', status: 'successful' }),
      todo({ dueDate: '2026-03-29T00:00:00.000Z' }), // later this week, not due yet
    ];
    const result = completionRate(todos, period, NOW);
    expect(result.dueCount).toBe(1);
    expect(result.rate).toBe(100);
  });
});

describe('completedVsPlanned', () => {
  const period = resolvePeriod('week', NOW, ZONE, NOW);

  it('counts all planned tasks, including future-dated ones', () => {
    const todos = [
      todo({ dueDate: '2026-03-23T00:00:00.000Z', status: 'successful' }),
      todo({ dueDate: '2026-03-29T00:00:00.000Z' }),
    ];
    expect(completedVsPlanned(todos, period)).toEqual({
      plannedCount: 2,
      completedCount: 1,
    });
  });

  it('is zero for an empty period', () => {
    expect(completedVsPlanned([], period)).toEqual({
      plannedCount: 0,
      completedCount: 0,
    });
  });
});

describe('unfinishedOverdue', () => {
  const period = resolvePeriod('week', NOW, ZONE, NOW);

  it('counts overdue and stale tasks planned in the period', () => {
    const todos = [
      todo({ dueDate: '2026-03-23T00:00:00.000Z' }), // 2 days overdue
      todo({ dueDate: '2026-03-16T00:00:00.000Z' }), // outside this period
    ];
    const result = unfinishedOverdue(todos, period, NOW);
    expect(result.overdueCount).toBe(1);
    expect(result.staleCount).toBe(0);
  });

  it('has zero counts for an empty period', () => {
    expect(unfinishedOverdue([], period, NOW)).toEqual({
      overdueCount: 0,
      staleCount: 0,
    });
  });
});

describe('planningLoad', () => {
  const period = resolvePeriod('week', NOW, ZONE, NOW);

  it('averages planned tasks per active day and finds the highest-load day', () => {
    const todos = [
      todo({ dueDate: '2026-03-23T10:00:00.000Z' }),
      todo({ dueDate: '2026-03-23T11:00:00.000Z' }),
      todo({ dueDate: '2026-03-24T10:00:00.000Z' }),
    ];
    const result = planningLoad(todos, period);
    expect(result.averagePerActiveDay).toBe(1.5);
    expect(result.highestLoadDay?.count).toBe(2);
  });

  it('is zero with no highest-load day when the period has nothing planned', () => {
    const result = planningLoad([], period);
    expect(result.averagePerActiveDay).toBe(0);
    expect(result.highestLoadDay).toBeNull();
  });

  it('buckets a day boundary in the period zone, not UTC', () => {
    // 23:30 Berlin on 23 March is 22:30 UTC — still 23 March locally.
    const todos = [todo({ dueDate: '2026-03-23T22:30:00.000Z' })];
    const result = planningLoad(todos, period);
    expect(result.highestLoadDay?.label).toBe('Mar 23');
  });
});

describe('workloadDistribution', () => {
  const period = resolvePeriod('week', NOW, ZONE, NOW);

  it('reports busiest/lightest days and deviation from a 12-week baseline', () => {
    const periodTodos = [
      todo({ dueDate: '2026-03-23T10:00:00.000Z' }),
      todo({ dueDate: '2026-03-23T11:00:00.000Z' }),
      todo({ dueDate: '2026-03-24T10:00:00.000Z' }),
    ];
    // One task per weekday for the prior 12 weeks establishes a baseline of 1/day.
    const historyTodos: TodoItem[] = [];
    for (let i = 1; i <= 60; i++) {
      const d = new Date(period.start.getTime() - i * 86_400_000);
      historyTodos.push(todo({ dueDate: d.toISOString() }));
    }
    const result = workloadDistribution(
      periodTodos,
      [...periodTodos, ...historyTodos],
      period
    );
    expect(result.busiest?.count).toBe(2);
    expect(result.lightest?.count).toBe(1);
    expect(result.normalPerActiveDay).toBe(1);
    expect(result.deviationFromNormal).toBe(0.5);
  });

  it('has a null baseline when there is no history before the period', () => {
    const result = workloadDistribution([], [], period);
    expect(result.normalPerActiveDay).toBeNull();
    expect(result.deviationFromNormal).toBeNull();
  });
});

describe('plannedVsCompletedSeries', () => {
  it('produces one point per bucket with planned/completed/unfinished counts', () => {
    const period = resolvePeriod('week', NOW, ZONE, NOW);
    const todos = [
      todo({ dueDate: '2026-03-23T10:00:00.000Z', status: 'successful' }),
      todo({ dueDate: '2026-03-23T11:00:00.000Z', status: 'pending' }),
    ];
    const series = plannedVsCompletedSeries(todos, period);
    expect(series).toHaveLength(7);
    const monday = series.find((p) => p.label === 'Mon');
    expect(monday).toEqual({
      label: 'Mon',
      planned: 2,
      completed: 1,
      unfinished: 1,
    });
  });

  it('has zero-filled buckets for an empty period', () => {
    const period = resolvePeriod('week', NOW, ZONE, NOW);
    const series = plannedVsCompletedSeries([], period);
    expect(series.every((p) => p.planned === 0)).toBe(true);
  });
});
