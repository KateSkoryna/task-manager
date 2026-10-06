import { TodoItem, TodoList } from '@shared/types';

export const isArchived = (todo: Pick<TodoItem, 'archivedAt'>) =>
  Boolean(todo.archivedAt);

/** The update that archives a task, now. */
export const archiveUpdate = () => ({ archivedAt: new Date().toISOString() });

/** The update that brings an archived task back. */
export const restoreUpdate = () => ({ archivedAt: null });

/** Lists with their archived tasks removed. */
export const withoutArchivedTodos = (lists: TodoList[]): TodoList[] =>
  lists.map((list) => ({
    ...list,
    todos: list.todos.filter((todo) => !isArchived(todo)),
  }));

export const activeTodos = (todos: TodoItem[]): TodoItem[] =>
  todos.filter((todo) => !isArchived(todo));
