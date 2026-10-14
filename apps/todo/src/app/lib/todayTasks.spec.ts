import type { TodoItem } from '@shared/types';
import {
  daysLate,
  isDueLater,
  selectDueToday,
  selectOverdue,
  toggledCompletion,
} from './todayTasks';

const TODAY = '2026-08-19';

function todo(overrides: Partial<TodoItem>): TodoItem {
  return {
    id: 'id',
    name: 'task',
    status: 'pending',
    todolistId: null,
    order: 0,
    priority: 'medium',
    source: 'web',
    ...overrides,
  };
}

describe('selectOverdue', () => {
  it('keeps unfinished tasks due before today, oldest first', () => {
    const result = selectOverdue(
      [
        todo({ id: 'yesterday', dueDate: '2026-08-18' }),
        todo({ id: 'last-week', dueDate: '2026-08-12T10:00:00.000Z' }),
        todo({ id: 'today', dueDate: TODAY }),
        todo({ id: 'done', dueDate: '2026-08-10', status: 'successful' }),
        todo({ id: 'no-date' }),
      ],
      TODAY
    );
    expect(result.map((t) => t.id)).toEqual(['last-week', 'yesterday']);
  });
});

describe('selectDueToday', () => {
  it('orders by priority, then by name, whether or not a task is done', () => {
    const result = selectDueToday(
      [
        todo({ id: 'low', name: 'Low', dueDate: TODAY, priority: 'low' }),
        todo({
          id: 'done-high',
          name: 'Beta',
          dueDate: TODAY,
          priority: 'high',
          status: 'successful',
        }),
        todo({ id: 'high', name: 'Alpha', dueDate: TODAY, priority: 'high' }),
        todo({
          id: 'medium',
          name: 'Medium',
          dueDate: TODAY,
          priority: 'medium',
        }),
        todo({ id: 'tomorrow', name: 'Later', dueDate: '2026-08-20' }),
      ],
      TODAY
    );
    expect(result.map((t) => t.id)).toEqual([
      'high',
      'done-high',
      'medium',
      'low',
    ]);
  });

  it('keeps a task in its place when it is marked done', () => {
    const before = [
      todo({ id: 'a', name: 'A', dueDate: TODAY, priority: 'high' }),
      todo({ id: 'b', name: 'B', dueDate: TODAY, priority: 'high' }),
      todo({ id: 'c', name: 'C', dueDate: TODAY, priority: 'high' }),
    ];
    const after = before.map((t) =>
      t.id === 'a' ? { ...t, status: 'successful' as const } : t
    );

    expect(selectDueToday(after, TODAY).map((t) => t.id)).toEqual(
      selectDueToday(before, TODAY).map((t) => t.id)
    );
  });
});

describe('daysLate', () => {
  it('counts whole days between the due date and today', () => {
    expect(daysLate(todo({ dueDate: '2026-08-16' }), TODAY)).toBe(3);
  });
});

describe('isDueLater', () => {
  it('is true only for a due date after today', () => {
    expect(isDueLater(todo({ dueDate: '2026-08-20' }), TODAY)).toBe(true);
    expect(isDueLater(todo({ dueDate: TODAY }), TODAY)).toBe(false);
    expect(isDueLater(todo({ dueDate: '2026-08-01' }), TODAY)).toBe(false);
    expect(isDueLater(todo({}), TODAY)).toBe(false);
  });
});

describe('toggledCompletion', () => {
  it('completes an unfinished task with a completion time', () => {
    const result = toggledCompletion(todo({ status: 'failed' }));
    expect(result.status).toBe('successful');
    expect(result.completedAt).toEqual(expect.any(String));
  });

  it('reopens a completed task and clears the completion time', () => {
    expect(toggledCompletion(todo({ status: 'successful' }))).toEqual({
      status: 'pending',
      completedAt: null,
    });
  });
});
