import { TodoItem, TodoList } from '@shared/types';
import {
  activeTodos,
  archiveUpdate,
  isArchived,
  restoreUpdate,
  withoutArchivedTodos,
} from './archive';

const todo = (name: string, archivedAt?: string | null): TodoItem => ({
  id: name,
  name,
  status: 'pending',
  todolistId: null,
  order: 0,
  priority: 'medium',
  source: 'web',
  archivedAt,
});

describe('archive helpers', () => {
  it('treats a task as archived only when archivedAt is set', () => {
    expect(isArchived(todo('a', '2026-09-01T00:00:00.000Z'))).toBe(true);
    expect(isArchived(todo('b', null))).toBe(false);
    expect(isArchived(todo('c'))).toBe(false);
  });

  it('builds archive and restore updates', () => {
    expect(new Date(archiveUpdate().archivedAt).toString()).not.toBe(
      'Invalid Date'
    );
    expect(restoreUpdate()).toEqual({ archivedAt: null });
  });

  it('filters archived tasks out of lists and inbox tasks', () => {
    const lists: TodoList[] = [
      {
        id: 'l1',
        name: 'Work',
        userId: 'u',
        todos: [todo('keep'), todo('gone', '2026-09-01T00:00:00.000Z')],
      },
    ];
    expect(withoutArchivedTodos(lists)[0].todos.map((t) => t.name)).toEqual([
      'keep',
    ]);
    expect(
      activeTodos([todo('keep'), todo('gone', '2026-09-01T00:00:00.000Z')]).map(
        (t) => t.name
      )
    ).toEqual(['keep']);
  });
});
