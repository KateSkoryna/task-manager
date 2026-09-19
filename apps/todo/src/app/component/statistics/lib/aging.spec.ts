import { TodoItem } from '@shared/types';
import { agingBuckets, agingSummary } from './aging';

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

describe('agingBuckets', () => {
  it('sorts overdue tasks into age buckets', () => {
    const todos = [
      todo({ id: 'a', dueDate: '2026-03-24T02:00:00.000Z' }), // 1 day
      todo({ id: 'b', dueDate: '2026-03-22T02:00:00.000Z' }), // 3 days
      todo({ id: 'c', dueDate: '2026-03-10T02:00:00.000Z' }), // stale
      todo({ id: 'd', dueDate: '2026-03-30T02:00:00.000Z' }), // future, not overdue
      todo({
        id: 'e',
        dueDate: '2026-03-20T02:00:00.000Z',
        status: 'successful',
      }), // done, not overdue
    ];
    const buckets = agingBuckets(todos, NOW, ZONE);
    expect(buckets).toEqual([
      { label: '1 day', count: 1 },
      { label: '2-3 days', count: 1 },
      { label: '4-7 days', count: 0 },
      { label: 'more than 7 days', count: 1 },
    ]);
  });

  it('has every bucket present but empty when nothing is overdue', () => {
    const buckets = agingBuckets([], NOW, ZONE);
    expect(buckets.every((b) => b.count === 0)).toBe(true);
    expect(buckets).toHaveLength(4);
  });
});

describe('agingSummary', () => {
  it('summarizes overdue count, average age, and the oldest task', () => {
    const todos = [
      todo({
        id: 'a',
        name: 'Recent',
        dueDate: '2026-03-24T02:00:00.000Z',
        todolistId: 'work-list',
      }),
      todo({
        id: 'b',
        name: 'Oldest',
        dueDate: '2026-03-10T02:00:00.000Z',
        todolistId: null,
      }),
    ];
    const result = agingSummary(todos, NOW, ZONE, { 'work-list': 'work' });
    expect(result.overdueCount).toBe(2);
    expect(result.staleCount).toBe(1);
    expect(result.oldestTask?.id).toBe('b');
    expect(result.oldestTask?.category).toBe('uncategorized');
    expect(result.categoriesWithOldestTasks).toEqual(['uncategorized']);
    expect(result.newestTask?.id).toBe('a');
    expect(result.newestTask?.category).toBe('work');
    expect(result.categoriesWithNewestTasks).toEqual(['work']);
  });

  it('has a null average and no oldest or newest task when nothing is overdue', () => {
    const result = agingSummary([], NOW, ZONE, {});
    expect(result.overdueCount).toBe(0);
    expect(result.averageAgeDays).toBeNull();
    expect(result.oldestTask).toBeNull();
    expect(result.newestTask).toBeNull();
    expect(result.categoriesWithNewestTasks).toEqual([]);
  });

  it('reports the same task as oldest and newest when only one task is overdue', () => {
    const todos = [
      todo({ id: 'a', name: 'Only one', dueDate: '2026-03-24T02:00:00.000Z' }),
    ];
    const result = agingSummary(todos, NOW, ZONE, {});
    expect(result.oldestTask?.id).toBe('a');
    expect(result.newestTask?.id).toBe('a');
  });
});
