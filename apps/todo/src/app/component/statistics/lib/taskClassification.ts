import { TodoItem, TodoListCategory, startOfDayInZone } from '@shared/types';
import { Period } from './periods';

export type Category = TodoListCategory | 'uncategorized';

export const isPlannedIn = (todo: TodoItem, period: Period): boolean => {
  if (!todo.dueDate) return false;
  const t = new Date(todo.dueDate).getTime();
  return t >= period.start.getTime() && t <= period.end.getTime();
};

export const isDue = (todo: TodoItem, now: Date): boolean =>
  !!todo.dueDate && new Date(todo.dueDate).getTime() <= now.getTime();

export const isCompleted = (todo: TodoItem): boolean =>
  todo.status === 'successful';

export const isUnfinished = (todo: TodoItem): boolean =>
  todo.status !== 'successful';

export const isUnscheduled = (todo: TodoItem): boolean => !todo.dueDate;

export const overdueAgeInDays = (
  todo: TodoItem,
  now: Date,
  zone: string
): number => {
  if (!todo.dueDate) return 0;
  const todayStart = startOfDayInZone(now, zone).getTime();
  const dueDayStart = startOfDayInZone(todo.dueDate, zone).getTime();
  return Math.max(0, Math.round((todayStart - dueDayStart) / 86_400_000));
};

export const isOverdue = (todo: TodoItem, now: Date, zone: string): boolean => {
  if (!todo.dueDate || isCompleted(todo)) return false;
  return overdueAgeInDays(todo, now, zone) > 0;
};

export const isStale = (todo: TodoItem, now: Date, zone: string): boolean =>
  isOverdue(todo, now, zone) && overdueAgeInDays(todo, now, zone) > 7;

export const categoryOf = (
  todo: TodoItem,
  categoryByListId: Record<string, Category>
): Category =>
  (todo.todolistId && categoryByListId[todo.todolistId]) || 'uncategorized';
