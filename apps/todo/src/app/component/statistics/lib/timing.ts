import { TodoItem, TodoPriority } from '@shared/types';
import { Period } from './periods';
import { categoryOf, Category } from './taskClassification';
import { CATEGORIES } from './categories';
import { PRIORITIES } from './priorities';
import { median, average, round1 } from './statsMath';

export interface TimingStats {
  medianDays: number | null;
  averageDays: number | null;
  sampleSize: number;
}

/** Days between `createdAt` and `completedAt` for tasks completed inside the
 * period. Tasks missing either timestamp are skipped. */
function completionDaysIn(todos: TodoItem[], period: Period): number[] {
  const days: number[] = [];
  for (const t of todos) {
    if (t.status !== 'successful' || !t.completedAt || !t.createdAt) continue;
    const completedAt = new Date(t.completedAt).getTime();
    if (
      completedAt < period.start.getTime() ||
      completedAt > period.end.getTime()
    ) {
      continue;
    }
    const createdAt = new Date(t.createdAt).getTime();
    days.push((completedAt - createdAt) / 86_400_000);
  }
  return days;
}

function toStats(days: number[]): TimingStats {
  const med = median(days);
  const avg = average(days);
  return {
    medianDays: med !== null ? round1(med) : null,
    averageDays: avg !== null ? round1(avg) : null,
    sampleSize: days.length,
  };
}

export function timeToCompletion(
  todos: TodoItem[],
  period: Period
): TimingStats {
  return toStats(completionDaysIn(todos, period));
}

export function timeToCompletionByCategory(
  todos: TodoItem[],
  period: Period,
  categoryByListId: Record<string, Category>
): Record<Category, TimingStats> {
  const result = {} as Record<Category, TimingStats>;
  for (const category of CATEGORIES) {
    const inCategory = todos.filter(
      (t) => categoryOf(t, categoryByListId) === category
    );
    result[category] = toStats(completionDaysIn(inCategory, period));
  }
  return result;
}

export function timeToCompletionByPriority(
  todos: TodoItem[],
  period: Period
): Record<TodoPriority, TimingStats> {
  const result = {} as Record<TodoPriority, TimingStats>;
  for (const priority of PRIORITIES) {
    const inPriority = todos.filter((t) => t.priority === priority);
    result[priority] = toStats(completionDaysIn(inPriority, period));
  }
  return result;
}
