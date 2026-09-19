import { TodoItem, TodoPriority } from '@shared/types';
import { Period, bucketsFor } from './periods';
import { isPlannedIn, isDue, isCompleted } from './taskClassification';

export const PRIORITIES: TodoPriority[] = ['low', 'medium', 'high'];

export interface PriorityDistribution {
  low: number;
  medium: number;
  high: number;
  total: number;
  highSharePercent: number | null;
}

export function priorityDistribution(
  todos: TodoItem[],
  period: Period
): PriorityDistribution {
  const planned = todos.filter((t) => isPlannedIn(t, period));
  const counts = { low: 0, medium: 0, high: 0 };
  for (const t of planned) counts[t.priority]++;
  return {
    ...counts,
    total: planned.length,
    highSharePercent:
      planned.length > 0
        ? Math.round((counts.high / planned.length) * 100)
        : null,
  };
}

export interface PriorityTrendPoint {
  label: string;
  highSharePercent: number | null;
}

export function priorityHighShareTrend(
  todos: TodoItem[],
  period: Period
): PriorityTrendPoint[] {
  return bucketsFor(period).map((b) => {
    const inBucket = todos.filter((t) => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate).getTime();
      return d >= b.start.getTime() && d <= b.end.getTime();
    });
    const high = inBucket.filter((t) => t.priority === 'high').length;
    return {
      label: b.label,
      highSharePercent:
        inBucket.length > 0 ? Math.round((high / inBucket.length) * 100) : null,
    };
  });
}

export interface PriorityCompletion {
  priority: TodoPriority;
  dueCount: number;
  completedCount: number;
  completionRatePercent: number | null;
}

export function priorityCompletionRates(
  todos: TodoItem[],
  period: Period,
  now: Date
): PriorityCompletion[] {
  const planned = todos.filter((t) => isPlannedIn(t, period));
  return PRIORITIES.map((priority) => {
    const due = planned.filter((t) => t.priority === priority && isDue(t, now));
    const completed = due.filter(isCompleted);
    return {
      priority,
      dueCount: due.length,
      completedCount: completed.length,
      completionRatePercent:
        due.length > 0
          ? Math.round((completed.length / due.length) * 100)
          : null,
    };
  });
}
