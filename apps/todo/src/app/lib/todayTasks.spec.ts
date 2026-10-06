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
  it('orders unfinished tasks first, then by priority', () => {
    const result = selectDueToday(
      [
        todo({ id: 'low', dueDate: TODAY, priority: 'low' }),
        todo({
          id: 'done-high',
          dueDate: TODAY,
          priority: 'high',
          status: 'successful',
        }),
        todo({ id: 'high', dueDate: TODAY, priority: 'high' }),
        todo({ id: 'medium', dueDate: TODAY, priority: 'medium' }),
        todo({ id: 'tomorrow', dueDate: '2026-08-20' }),
      ],
      TODAY
    );
    expect(result.map((t) => t.id)).toEqual([
      'high',
      'medium',
      'low',
      'done-high',
    ]);
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
