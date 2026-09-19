import { TodoItem } from '@shared/types';
import { Period } from './periods';
import {
  isPlannedIn,
  isCompleted,
  categoryOf,
  Category,
} from './taskClassification';

export const CATEGORIES: Category[] = [
  'home',
  'education',
  'work',
  'family',
  'health',
  'uncategorized',
];

export interface CategoryBreakdown {
  category: Category;
  plannedCount: number;
  plannedSharePercent: number | null;
  completedCount: number;
  completionRatePercent: number | null;
}

export function categoryBreakdown(
  todos: TodoItem[],
  period: Period,
  categoryByListId: Record<string, Category>
): CategoryBreakdown[] {
  const planned = todos.filter((t) => isPlannedIn(t, period));
  const totalPlanned = planned.length;

  return CATEGORIES.map((category) => {
    const inCategory = planned.filter(
      (t) => categoryOf(t, categoryByListId) === category
    );
    const completed = inCategory.filter(isCompleted);
    return {
      category,
      plannedCount: inCategory.length,
      plannedSharePercent:
        totalPlanned > 0
          ? Math.round((inCategory.length / totalPlanned) * 100)
          : null,
      completedCount: completed.length,
      completionRatePercent:
        inCategory.length > 0
          ? Math.round((completed.length / inCategory.length) * 100)
          : null,
    };
  });
}
