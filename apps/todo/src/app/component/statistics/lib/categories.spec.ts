import { TodoItem } from '@shared/types';
import { resolvePeriod } from './periods';
import { categoryBreakdown, CATEGORIES } from './categories';

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

describe('categoryBreakdown', () => {
  const period = resolvePeriod('week', NOW, ZONE, NOW);

  it('splits planned tasks by category, including uncategorized for inbox tasks', () => {
    const todos = [
      todo({
        dueDate: '2026-03-23T00:00:00.000Z',
        todolistId: 'work-list',
        status: 'successful',
      }),
      todo({
        dueDate: '2026-03-23T00:00:00.000Z',
        todolistId: 'work-list',
        status: 'pending',
      }),
      todo({ dueDate: '2026-03-24T00:00:00.000Z', todolistId: null }),
    ];
    const result = categoryBreakdown(todos, period, { 'work-list': 'work' });
    const work = result.find((r) => r.category === 'work')!;
    const uncategorized = result.find((r) => r.category === 'uncategorized')!;

    expect(work).toEqual({
      category: 'work',
      plannedCount: 2,
      plannedSharePercent: 67,
      completedCount: 1,
      completionRatePercent: 50,
    });
    expect(uncategorized.plannedCount).toBe(1);
  });

  it('returns every fixed category with null rates when the period is empty', () => {
    const result = categoryBreakdown([], period, {});
    expect(result.map((r) => r.category)).toEqual(CATEGORIES);
    expect(result.every((r) => r.plannedCount === 0)).toBe(true);
    expect(result.every((r) => r.plannedSharePercent === null)).toBe(true);
    expect(result.every((r) => r.completionRatePercent === null)).toBe(true);
  });

  it('has a null completion rate for a category with nothing planned', () => {
    const todos = [
      todo({ dueDate: '2026-03-23T00:00:00.000Z', todolistId: 'work-list' }),
    ];
    const result = categoryBreakdown(todos, period, { 'work-list': 'work' });
    const family = result.find((r) => r.category === 'family')!;
    expect(family.plannedCount).toBe(0);
    expect(family.completionRatePercent).toBeNull();
  });
});
