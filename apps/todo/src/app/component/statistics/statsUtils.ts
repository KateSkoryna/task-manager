import dayjs from 'dayjs';
import { TodoItem, TodoList } from '@shared/types';

export type Period = 'week' | 'month' | 'year';

export interface TimeSeriesPoint {
  label: string;
  total: number;
  successful: number;
  failed: number;
  pending: number;
}

export interface WeekdayPoint {
  day: string;
  total: number;
  successful: number;
}

export interface StatusPoint {
  name: string;
  value: number;
  color: string;
}

export interface CategoryPoint {
  name: string;
  total: number;
  successful: number;
}

// Recharts requires resolved color strings, not Tailwind classes, so these
// read our theme tokens via the rgb(var(--color-x)) form rather than
// hardcoding hex — see guideline §4.6 on raw-value consumers.
export const CHART_COLORS = {
  successful: 'rgb(var(--color-status-complete))',
  pending: 'rgb(var(--color-status-progress))',
  failed: 'rgb(var(--color-status-open))',
  total: 'rgb(var(--color-primary) / 0.55)',
  grid: 'rgb(var(--color-default))',
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getTodoDate(todo: TodoItem): string | null {
  return todo.dueDate || todo.completedAt || null;
}

function getFilterStart(period: Period) {
  const now = dayjs();
  if (period === 'week') return now.subtract(7, 'day');
  if (period === 'month') return now.subtract(30, 'day');
  return now.subtract(365, 'day');
}

export function filterByPeriod(todos: TodoItem[], period: Period): TodoItem[] {
  const start = getFilterStart(period);
  return todos.filter((todo) => {
    const date = getTodoDate(todo);
    if (!date) return true;
    return dayjs(date).isAfter(start);
  });
}

export function computeTimeSeries(
  todos: TodoItem[],
  period: Period
): TimeSeriesPoint[] {
  const now = dayjs();
  const buckets: { label: string; start: dayjs.Dayjs; end: dayjs.Dayjs }[] = [];

  if (period === 'week') {
    for (let i = 6; i >= 0; i--) {
      const day = now.subtract(i, 'day');
      buckets.push({
        label: day.format('ddd'),
        start: day.startOf('day'),
        end: day.endOf('day'),
      });
    }
  } else if (period === 'month') {
    for (let i = 3; i >= 0; i--) {
      const weekStart = now.subtract(i * 7 + 6, 'day');
      const weekEnd = now.subtract(i * 7, 'day');
      buckets.push({
        label: `W${4 - i}`,
        start: weekStart.startOf('day'),
        end: weekEnd.endOf('day'),
      });
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const month = now.subtract(i, 'month');
      buckets.push({
        label: month.format('MMM'),
        start: month.startOf('month'),
        end: month.endOf('month'),
      });
    }
  }

  return buckets.map((bucket) => {
    const bucketTodos = todos.filter((todo) => {
      const date = getTodoDate(todo);
      if (!date) return false;
      const d = dayjs(date);
      return (
        d.isAfter(bucket.start.subtract(1, 'ms')) &&
        d.isBefore(bucket.end.add(1, 'ms'))
      );
    });
    return {
      label: bucket.label,
      total: bucketTodos.length,
      successful: bucketTodos.filter((t) => t.status === 'successful').length,
      failed: bucketTodos.filter((t) => t.status === 'failed').length,
      pending: bucketTodos.filter((t) => t.status === 'pending').length,
    };
  });
}

export function computeWeekdayData(todos: TodoItem[]): WeekdayPoint[] {
  const counts = new Array(7)
    .fill(null)
    .map(() => ({ total: 0, successful: 0 }));
  todos.forEach((todo) => {
    const date = getTodoDate(todo);
    if (!date) return;
    const dayIndex = (dayjs(date).day() + 6) % 7; // Mon=0, Sun=6
    counts[dayIndex].total++;
    if (todo.status === 'successful') counts[dayIndex].successful++;
  });
  return WEEKDAYS.map((day, i) => ({
    day,
    total: counts[i].total,
    successful: counts[i].successful,
  }));
}

export function computeStatusData(todos: TodoItem[]): StatusPoint[] {
  const pending = todos.filter((t) => t.status === 'pending').length;
  const successful = todos.filter((t) => t.status === 'successful').length;
  const failed = todos.filter((t) => t.status === 'failed').length;
  return [
    { name: 'Pending', value: pending, color: CHART_COLORS.pending },
    { name: 'Done', value: successful, color: CHART_COLORS.successful },
    { name: 'Failed', value: failed, color: CHART_COLORS.failed },
  ].filter((s) => s.value > 0);
}

export function computeCategoryData(todoLists: TodoList[]): CategoryPoint[] {
  const categories = ['home', 'education', 'work', 'family', 'health'];
  return categories
    .map((cat) => {
      const lists = todoLists.filter((l) => l.category === cat);
      const todos = lists.flatMap((l) => l.todos);
      return {
        name: cat.charAt(0).toUpperCase() + cat.slice(1),
        total: todos.length,
        successful: todos.filter((t) => t.status === 'successful').length,
      };
    })
    .filter((c) => c.total > 0);
}

export function getDaysTracked(todoLists: TodoList[]): number {
  const allTodos = todoLists.flatMap((l) => l.todos);
  const dates = allTodos
    .map((t) => getTodoDate(t))
    .filter(Boolean)
    .map((d) => dayjs(d as string));
  if (dates.length === 0) return 0;
  const earliest = dates.reduce((a, b) => (a.isBefore(b) ? a : b));
  return dayjs().diff(earliest, 'day') + 1;
}
