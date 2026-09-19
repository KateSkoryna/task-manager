import { TodoItem, dayKeyInZone, inZone } from '@shared/types';
import { Period, bucketsFor } from './periods';
import {
  isPlannedIn,
  isDue,
  isCompleted,
  isUnfinished,
  isOverdue,
  isStale,
} from './taskClassification';

export interface CompletionRate {
  /** 0-100, or null when nothing was due — never 0%. */
  rate: number | null;
  completedCount: number;
  dueCount: number;
}

export function completionRate(
  todos: TodoItem[],
  period: Period,
  now: Date
): CompletionRate {
  const planned = todos.filter((t) => isPlannedIn(t, period));
  const due = planned.filter((t) => isDue(t, now));
  const completed = due.filter(isCompleted);
  return {
    rate:
      due.length > 0 ? Math.round((completed.length / due.length) * 100) : null,
    completedCount: completed.length,
    dueCount: due.length,
  };
}

export interface CompletedVsPlanned {
  completedCount: number;
  plannedCount: number;
}

export function completedVsPlanned(
  todos: TodoItem[],
  period: Period
): CompletedVsPlanned {
  const planned = todos.filter((t) => isPlannedIn(t, period));
  return {
    plannedCount: planned.length,
    completedCount: planned.filter(isCompleted).length,
  };
}

export interface UnfinishedOverdue {
  overdueCount: number;
  staleCount: number;
}

export function unfinishedOverdue(
  todos: TodoItem[],
  period: Period,
  now: Date
): UnfinishedOverdue {
  const planned = todos.filter((t) => isPlannedIn(t, period));
  return {
    overdueCount: planned.filter((t) => isOverdue(t, now, period.zone)).length,
    staleCount: planned.filter((t) => isStale(t, now, period.zone)).length,
  };
}

interface DayLoad {
  label: string;
  count: number;
}

/** Planned-task counts bucketed by calendar day (in the period's zone), only
 * for days between `period.start` and `period.cutoff`. Shared by
 * `planningLoad` and `workloadDistribution` so "active day" means the same
 * thing in both. */
function countsByActiveDay(
  todos: TodoItem[],
  zone: string,
  start: number,
  end: number
): DayLoad[] {
  const countsByDay = new Map<string, number>();
  for (const t of todos) {
    if (!t.dueDate) continue;
    const d = new Date(t.dueDate).getTime();
    if (d < start || d > end) continue;
    const key = dayKeyInZone(t.dueDate, zone);
    countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1);
  }
  return Array.from(countsByDay.entries()).map(([key, count]) => ({
    label: inZone(key, zone).format('MMM D'),
    count,
  }));
}

export interface PlanningLoad {
  averagePerActiveDay: number;
  highestLoadDay: DayLoad | null;
}

export function planningLoad(todos: TodoItem[], period: Period): PlanningLoad {
  const days = countsByActiveDay(
    todos,
    period.zone,
    period.start.getTime(),
    period.cutoff.getTime()
  );
  const total = days.reduce((sum, d) => sum + d.count, 0);
  const highestLoadDay = days.reduce<DayLoad | null>(
    (max, d) => (!max || d.count > max.count ? d : max),
    null
  );
  return {
    averagePerActiveDay:
      days.length > 0 ? Math.round((total / days.length) * 10) / 10 : 0,
    highestLoadDay,
  };
}

export interface WorkloadDistribution {
  averagePerActiveDay: number;
  busiest: DayLoad | null;
  lightest: DayLoad | null;
  /** The user's own average planned tasks per active day over the 12 weeks
   * before this period. Null when there is no history to compare against. */
  normalPerActiveDay: number | null;
  deviationFromNormal: number | null;
}

const TWELVE_WEEKS_MS = 12 * 7 * 86_400_000;

export function workloadDistribution(
  periodTodos: TodoItem[],
  allTodos: TodoItem[],
  period: Period
): WorkloadDistribution {
  const days = countsByActiveDay(
    periodTodos,
    period.zone,
    period.start.getTime(),
    period.cutoff.getTime()
  );
  const total = days.reduce((sum, d) => sum + d.count, 0);
  const average = days.length > 0 ? total / days.length : 0;

  let busiest: DayLoad | null = null;
  let lightest: DayLoad | null = null;
  for (const d of days) {
    if (!busiest || d.count > busiest.count) busiest = d;
    if (!lightest || d.count < lightest.count) lightest = d;
  }

  const historyStart = period.start.getTime() - TWELVE_WEEKS_MS;
  const historyDays = countsByActiveDay(
    allTodos,
    period.zone,
    historyStart,
    period.start.getTime() - 1
  );
  const normalPerActiveDay =
    historyDays.length > 0
      ? historyDays.reduce((sum, d) => sum + d.count, 0) / historyDays.length
      : null;

  return {
    averagePerActiveDay: Math.round(average * 10) / 10,
    busiest,
    lightest,
    normalPerActiveDay:
      normalPerActiveDay !== null
        ? Math.round(normalPerActiveDay * 10) / 10
        : null,
    deviationFromNormal:
      normalPerActiveDay !== null
        ? Math.round((average - normalPerActiveDay) * 10) / 10
        : null,
  };
}

export interface SeriesPoint {
  label: string;
  planned: number;
  completed: number;
  unfinished: number;
}

export function plannedVsCompletedSeries(
  todos: TodoItem[],
  period: Period
): SeriesPoint[] {
  const buckets = bucketsFor(period);
  return buckets.map((b) => {
    const inBucket = todos.filter((t) => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate).getTime();
      return d >= b.start.getTime() && d <= b.end.getTime();
    });
    return {
      label: b.label,
      planned: inBucket.length,
      completed: inBucket.filter(isCompleted).length,
      unfinished: inBucket.filter(isUnfinished).length,
    };
  });
}
