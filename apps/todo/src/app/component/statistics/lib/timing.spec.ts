import { TodoItem } from '@shared/types';
import { resolvePeriod } from './periods';
import {
  timeToCompletion,
  timeToCompletionByCategory,
  timeToCompletionByPriority,
} from './timing';

const ZONE = 'Europe/Berlin';
const NOW = new Date('2026-03-25T10:00:00.000Z');

function todo(overrides: Partial<TodoItem> = {}): TodoItem {
  return {
    id: overrides.id ?? Math.random().toString(),
    name: 'Task',
    status: 'successful',
    todolistId: null,
    order: 0,
    priority: 'medium',
    source: 'web',
    dueDate: null,
    ...overrides,
  };
}

describe('timeToCompletion', () => {
  const period = resolvePeriod('week', NOW, ZONE, NOW);

  it('computes median and average days from createdAt to completedAt', () => {
    const todos = [
      todo({
        createdAt: '2026-03-21T00:00:00.000Z',
        completedAt: '2026-03-23T00:00:00.000Z',
      }), // 2 days
      todo({
        createdAt: '2026-03-20T00:00:00.000Z',
        completedAt: '2026-03-24T00:00:00.000Z',
      }), // 4 days
    ];
    const result = timeToCompletion(todos, period);
    expect(result).toEqual({ medianDays: 3, averageDays: 3, sampleSize: 2 });
  });

  it('is null with a zero sample size for an empty period', () => {
    expect(timeToCompletion([], period)).toEqual({
      medianDays: null,
      averageDays: null,
      sampleSize: 0,
    });
  });

  it('skips tasks missing createdAt or completedAt rather than throwing', () => {
    const todos = [
      todo({ completedAt: '2026-03-23T00:00:00.000Z' }), // no createdAt
      todo({ createdAt: '2026-03-20T00:00:00.000Z', completedAt: null }),
    ];
    expect(timeToCompletion(todos, period).sampleSize).toBe(0);
  });

  it('excludes tasks completed outside the period', () => {
    const todos = [
      todo({
        createdAt: '2026-01-01T00:00:00.000Z',
        completedAt: '2026-01-05T00:00:00.000Z',
      }),
    ];
    expect(timeToCompletion(todos, period).sampleSize).toBe(0);
  });
});

describe('timeToCompletionByCategory and timeToCompletionByPriority', () => {
  const period = resolvePeriod('week', NOW, ZONE, NOW);

  it('groups by category, including uncategorized', () => {
    const todos = [
      todo({
        todolistId: 'work-list',
        createdAt: '2026-03-21T00:00:00.000Z',
        completedAt: '2026-03-23T00:00:00.000Z',
      }),
    ];
    const result = timeToCompletionByCategory(todos, period, {
      'work-list': 'work',
    });
    expect(result.work.sampleSize).toBe(1);
    expect(result.family.sampleSize).toBe(0);
  });

  it('groups by priority', () => {
    const todos = [
      todo({
        priority: 'high',
        createdAt: '2026-03-21T00:00:00.000Z',
        completedAt: '2026-03-23T00:00:00.000Z',
      }),
    ];
    const result = timeToCompletionByPriority(todos, period);
    expect(result.high.sampleSize).toBe(1);
    expect(result.low.sampleSize).toBe(0);
  });
});
