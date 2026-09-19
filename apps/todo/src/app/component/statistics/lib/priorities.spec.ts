import { TodoItem } from '@shared/types';
import { resolvePeriod } from './periods';
import {
  priorityDistribution,
  priorityHighShareTrend,
  priorityCompletionRates,
} from './priorities';

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

describe('priorityDistribution', () => {
  const period = resolvePeriod('week', NOW, ZONE, NOW);

  it('counts planned tasks by priority and the High share', () => {
    const todos = [
      todo({ dueDate: '2026-03-23T00:00:00.000Z', priority: 'high' }),
      todo({ dueDate: '2026-03-23T00:00:00.000Z', priority: 'high' }),
      todo({ dueDate: '2026-03-24T00:00:00.000Z', priority: 'low' }),
    ];
    expect(priorityDistribution(todos, period)).toEqual({
      low: 1,
      medium: 0,
      high: 2,
      total: 3,
      highSharePercent: 67,
    });
  });

  it('has a null High share when the period is empty', () => {
    expect(priorityDistribution([], period).highSharePercent).toBeNull();
  });
});

describe('priorityHighShareTrend', () => {
  it('produces a null-share point for buckets with nothing planned', () => {
    const period = resolvePeriod('week', NOW, ZONE, NOW);
    const trend = priorityHighShareTrend([], period);
    expect(trend).toHaveLength(7);
    expect(trend.every((p) => p.highSharePercent === null)).toBe(true);
  });

  it('computes the High share per bucket', () => {
    const period = resolvePeriod('week', NOW, ZONE, NOW);
    const todos = [
      todo({ dueDate: '2026-03-23T10:00:00.000Z', priority: 'high' }),
      todo({ dueDate: '2026-03-23T11:00:00.000Z', priority: 'low' }),
    ];
    const monday = priorityHighShareTrend(todos, period).find(
      (p) => p.label === 'Mon'
    );
    expect(monday?.highSharePercent).toBe(50);
  });
});

describe('priorityCompletionRates', () => {
  const period = resolvePeriod('week', NOW, ZONE, NOW);

  it('reports completion rate per priority for due tasks', () => {
    const todos = [
      todo({
        dueDate: '2026-03-23T00:00:00.000Z',
        priority: 'high',
        status: 'successful',
      }),
      todo({
        dueDate: '2026-03-24T00:00:00.000Z',
        priority: 'high',
        status: 'pending',
      }),
    ];
    const result = priorityCompletionRates(todos, period, NOW);
    const high = result.find((r) => r.priority === 'high')!;
    expect(high).toEqual({
      priority: 'high',
      dueCount: 2,
      completedCount: 1,
      completionRatePercent: 50,
    });
    const low = result.find((r) => r.priority === 'low')!;
    expect(low.completionRatePercent).toBeNull();
  });

  it('has null rates for every priority when nothing is due', () => {
    const result = priorityCompletionRates([], period, NOW);
    expect(result.every((r) => r.completionRatePercent === null)).toBe(true);
  });
});
