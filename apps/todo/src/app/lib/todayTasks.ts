import dayjs from 'dayjs';
import { TodoItem, TodoPriority, TodoStatus } from '@shared/types';

const PRIORITY_RANK: Record<TodoPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

// Due dates may carry a time part; only the calendar day matters here.
function dueDay(todo: TodoItem): string | null {
  return todo.dueDate ? todo.dueDate.slice(0, 10) : null;
}

export function isCompleted(todo: TodoItem): boolean {
  return todo.status === 'successful';
}

export function isDueLater(todo: TodoItem, todayStr: string): boolean {
  const day = dueDay(todo);
  return day !== null && day > todayStr;
}

/** Unfinished tasks due before `todayStr` (YYYY-MM-DD), oldest first. */
export function selectOverdue<T extends TodoItem>(
  todos: T[],
  todayStr: string
): T[] {
  return todos
    .filter((todo) => {
      const day = dueDay(todo);
      return day !== null && day < todayStr && !isCompleted(todo);
    })
    .sort((a, b) => (dueDay(a) ?? '').localeCompare(dueDay(b) ?? ''));
}

/** Tasks due on `todayStr`: unfinished first, then by priority. */
export function selectDueToday<T extends TodoItem>(
  todos: T[],
  todayStr: string
): T[] {
  return todos
    .filter((todo) => dueDay(todo) === todayStr)
    .sort(
      (a, b) =>
        Number(isCompleted(a)) - Number(isCompleted(b)) ||
        PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
    );
}

export function daysLate(todo: TodoItem, todayStr: string): number {
  const day = dueDay(todo);
  return day ? dayjs(todayStr).diff(dayjs(day), 'day') : 0;
}

/** The status change a completion checkbox makes: complete, or undo it. */
export function toggledCompletion(todo: TodoItem): {
  status: TodoStatus;
  completedAt: string | null;
} {
  const status: TodoStatus = isCompleted(todo) ? 'pending' : 'successful';
  return {
    status,
    completedAt: status === 'successful' ? new Date().toISOString() : null,
  };
}
