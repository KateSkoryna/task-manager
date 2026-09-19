import { TodoItem } from '@shared/types';
import {
  isOverdue,
  isStale,
  overdueAgeInDays,
  categoryOf,
  Category,
} from './taskClassification';
import { average } from './statsMath';

export type AgingBucketLabel =
  | '1 day'
  | '2-3 days'
  | '4-7 days'
  | 'more than 7 days';

export interface AgingBucket {
  label: AgingBucketLabel;
  count: number;
}

function bucketFor(ageDays: number): AgingBucketLabel {
  if (ageDays <= 1) return '1 day';
  if (ageDays <= 3) return '2-3 days';
  if (ageDays <= 7) return '4-7 days';
  return 'more than 7 days';
}

/** Describes the current state, not a selected period — "now" is the only time reference. */
export function agingBuckets(
  todos: TodoItem[],
  now: Date,
  zone: string
): AgingBucket[] {
  const labels: AgingBucketLabel[] = [
    '1 day',
    '2-3 days',
    '4-7 days',
    'more than 7 days',
  ];
  const overdue = todos.filter((t) => isOverdue(t, now, zone));
  const counts = new Map<AgingBucketLabel, number>(labels.map((l) => [l, 0]));
  for (const t of overdue) {
    const label = bucketFor(overdueAgeInDays(t, now, zone));
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return labels.map((label) => ({ label, count: counts.get(label) ?? 0 }));
}

export interface OldestTask {
  id: string;
  name: string;
  ageDays: number;
  category: Category;
}

export interface AgingSummary {
  overdueCount: number;
  staleCount: number;
  averageAgeDays: number | null;
  oldestTask: OldestTask | null;
  categoriesWithOldestTasks: Category[];
  newestTask: OldestTask | null;
  categoriesWithNewestTasks: Category[];
}

function extremeTask(
  overdue: TodoItem[],
  extremeAge: number | null,
  now: Date,
  zone: string,
  categoryByListId: Record<string, Category>
): { task: OldestTask | null; categories: Category[] } {
  if (extremeAge === null) return { task: null, categories: [] };
  let task: OldestTask | null = null;
  const categories = new Set<Category>();
  for (const t of overdue) {
    const ageDays = overdueAgeInDays(t, now, zone);
    if (ageDays === extremeAge) {
      const category = categoryOf(t, categoryByListId);
      categories.add(category);
      if (!task) task = { id: t.id, name: t.name, ageDays, category };
    }
  }
  return { task, categories: Array.from(categories) };
}

export function agingSummary(
  todos: TodoItem[],
  now: Date,
  zone: string,
  categoryByListId: Record<string, Category>
): AgingSummary {
  const overdue = todos.filter((t) => isOverdue(t, now, zone));
  const ages = overdue.map((t) => overdueAgeInDays(t, now, zone));
  const maxAge = ages.length > 0 ? Math.max(...ages) : null;
  const minAge = ages.length > 0 ? Math.min(...ages) : null;

  const oldest = extremeTask(overdue, maxAge, now, zone, categoryByListId);
  const newest = extremeTask(overdue, minAge, now, zone, categoryByListId);

  return {
    overdueCount: overdue.length,
    staleCount: overdue.filter((t) => isStale(t, now, zone)).length,
    averageAgeDays: average(ages),
    oldestTask: oldest.task,
    categoriesWithOldestTasks: oldest.categories,
    newestTask: newest.task,
    categoriesWithNewestTasks: newest.categories,
  };
}
