import { useEffect, useMemo, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { PieChart, Pie, Cell } from 'recharts';
import {
  ClipboardList,
  Check,
  CheckSquare,
  Flame,
  Inbox as InboxIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { TodoItem, TodoList, TodoStatus } from '@shared/types';
import {
  useTodoListsQuery,
  useInboxTodosQuery,
  useAddInboxTodoMutation,
  useDeleteTodoMutation,
} from '../../fetchers/api';
import { useDateStore } from '../../store/dateStore';
import { useIsCompactScreen } from '../../hooks/useIsCompactScreen';
import TodoItemComponent from '../todo/TodoItem';
import Input from '../elements/Input';
import Button from '../elements/Button';
import ErrorFallback from '../elements/ErrorFallback';
import DashboardSkeleton from './DashboardSkeleton';

// ─── helpers ────────────────────────────────────────────────────────────────

function toDateStr(d: Dayjs): string {
  return d.format('YYYY-MM-DD');
}

function isToday(d: Dayjs): boolean {
  return d.isSame(dayjs(), 'day');
}

function localeFor(language: string): string {
  if (language === 'de') return 'de-DE';
  if (language === 'uk') return 'uk-UA';
  return 'en-US';
}

// ─── flat item type ──────────────────────────────────────────────────────────

export interface FlatItem extends TodoItem {
  listCreatedAt: TodoList['createdAt'];
}

function flattenLists(lists: TodoList[]): FlatItem[] {
  return lists.flatMap((list) =>
    list.todos.map((todo) => ({
      ...todo,
      listCreatedAt: list.createdAt,
    }))
  );
}

function flattenInbox(todos: TodoItem[]): FlatItem[] {
  return todos.map((todo) => ({
    ...todo,
    listCreatedAt: undefined,
  }));
}

const STATUS_LABEL_KEYS: Record<TodoStatus, string> = {
  pending: 'tasks.status_pending',
  successful: 'tasks.status_successful',
  failed: 'tasks.status_failed',
};

const STATUS_TEXT: Record<TodoStatus, string> = {
  pending: 'text-status-progress',
  successful: 'text-status-complete',
  failed: 'text-status-open',
};

// ─── donut chart ─────────────────────────────────────────────────────────────

function DonutChart({
  value,
  total,
  color,
  dotColor,
  label,
}: {
  value: number;
  total: number;
  color: string;
  dotColor: string;
  label: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const data = [{ value: pct }, { value: 100 - pct }];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <PieChart width={112} height={112}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={36}
            outerRadius={50}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            strokeWidth={0}
          >
            <Cell fill={color} />
            <Cell fill="rgb(var(--color-default))" />
          </Pie>
        </PieChart>
        <span className="absolute inset-0 flex items-center justify-center text-base font-bold text-primary">
          {pct}%
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: dotColor }}
        />
        <span className="text-xs text-muted">{label}</span>
      </div>
    </div>
  );
}

// ─── completed card ───────────────────────────────────────────────────────────

function CompletedCard({ item }: { item: FlatItem }) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-default bg-surface p-4 h-[5rem] overflow-hidden">
      <div className="flex items-start gap-3">
        <div
          role="img"
          aria-label={t('dashboard.completed')}
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-status-complete ring-2 ring-inset ring-surface"
        >
          <Check className="h-3.5 w-3.5 text-surface" strokeWidth={3} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-primary leading-snug">
            {item.name}
          </p>
          <p className="text-xs mt-2 text-muted">
            {t('dashboard.status')}{' '}
            <span className="font-medium text-status-complete">
              {t('dashboard.completed')}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── panels ──────────────────────────────────────────────────────────────────

function TodoPanel({
  items,
  selectedDate,
  onEditTodo,
  onDeleteTodo,
  className = '',
}: {
  items: FlatItem[];
  selectedDate: Dayjs;
  onEditTodo?: (item: FlatItem) => void;
  onDeleteTodo?: (item: FlatItem) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const isCompact = useIsCompactScreen();
  // Always show 3 tasks per page on desktop/tablet — each item wrapper below
  // is flex-1 so the 3 cards share whatever height the panel actually has,
  // shrinking together instead of one getting clipped or a 3rd never fitting.
  const pageSize = 3;
  const [page, setPage] = useState(0);
  const dateKey = toDateStr(selectedDate);

  useEffect(() => {
    setPage(0);
  }, [dateKey]);

  const pageCount = Math.ceil(items.length / pageSize);
  const currentPage = Math.min(page, Math.max(pageCount - 1, 0));
  const pageItems = isCompact
    ? items
    : items.slice(currentPage * pageSize, currentPage * pageSize + pageSize);
  const hasPrev = !isCompact && currentPage > 0;
  const hasNext = !isCompact && currentPage < pageCount - 1;

  return (
    <div
      className={`${
        isCompact
          ? 'bg-surface rounded-xl border border-default p-4 flex flex-col'
          : 'bg-surface rounded-xl border border-default p-4 flex min-h-0 h-full flex-col'
      } ${className}`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-primary">
          <ClipboardList className="w-5 h-5" />
          <h3 className="font-bold text-lg leading-none">
            {t('dashboard.todo')}
          </h3>
        </div>

        {!isCompact && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
              disabled={!hasPrev}
              aria-label={t('dashboard.previousTasks')}
              className="flex items-center justify-center p-1 text-muted border border-default rounded-md hover:text-primary hover:border-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(p + 1, pageCount - 1))}
              disabled={!hasNext}
              aria-label={t('dashboard.nextTasks')}
              className="flex items-center justify-center p-1 text-muted border border-default rounded-md hover:text-primary hover:border-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-muted text-sm flex-1">
          {t('dashboard.noTasksForDay')}
        </p>
      ) : (
        <div
          className={
            isCompact
              ? 'space-y-3'
              : 'flex flex-col gap-2 min-h-0 flex-1 overflow-hidden'
          }
        >
          {pageItems.map((item) =>
            isCompact ? (
              <TodoItemComponent
                key={item.id}
                todo={item}
                onEdit={onEditTodo ? () => onEditTodo(item) : undefined}
                onDelete={onDeleteTodo ? () => onDeleteTodo(item) : undefined}
                hideDueDate
              />
            ) : (
              <div key={item.id} className="flex-1 min-h-0 overflow-hidden">
                <TodoItemComponent
                  todo={item}
                  onEdit={onEditTodo ? () => onEditTodo(item) : undefined}
                  onDelete={onDeleteTodo ? () => onDeleteTodo(item) : undefined}
                  hideDueDate
                />
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function TaskStatusPanel({
  selectedDate,
  successful,
  pending,
  failed,
  total,
}: {
  selectedDate: Dayjs;
  successful: number;
  pending: number;
  failed: number;
  total: number;
}) {
  const { t } = useTranslation();
  const [weekOffset, setWeekOffset] = useState(0);

  return (
    <div className="bg-surface rounded-xl border border-default p-4">
      <div className="flex items-center gap-2 text-primary mb-3">
        <ClipboardList className="w-5 h-5" />
        <h3 className="font-bold text-lg leading-none">
          {t('dashboard.taskStatus')}
        </h3>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setWeekOffset((o) => o - 1)}
            aria-label={t('dashboard.previousWeek')}
            className="flex items-center justify-center p-1 text-muted border border-default rounded-md hover:text-primary hover:border-primary transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset((o) => o + 1)}
            aria-label={t('dashboard.nextWeek')}
            className="flex items-center justify-center p-1 text-muted border border-default rounded-md hover:text-primary hover:border-primary transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="mb-3">
        <WeekStrip selectedDate={selectedDate} weekOffset={weekOffset} />
      </div>
      <div className="flex justify-around">
        <DonutChart
          value={successful}
          total={total}
          color="rgb(var(--color-status-complete))"
          dotColor="rgb(var(--color-status-complete))"
          label={t('dashboard.completed')}
        />
        <DonutChart
          value={pending}
          total={total}
          color="rgb(var(--color-status-progress))"
          dotColor="rgb(var(--color-status-progress))"
          label={t('dashboard.inProgress')}
        />
        <DonutChart
          value={failed}
          total={total}
          color="rgb(var(--color-status-open))"
          dotColor="rgb(var(--color-status-open))"
          label={t('dashboard.notStarted')}
        />
      </div>
    </div>
  );
}

function CompletedPanel({ items }: { items: FlatItem[] }) {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(items.length / 2);
  const currentPage = Math.min(page, Math.max(pageCount - 1, 0));
  const pageItems = items.slice(currentPage * 2, currentPage * 2 + 2);

  return (
    <div className="bg-surface rounded-xl border border-default p-4">
      <div className="flex items-center gap-2 text-primary mb-3">
        <CheckSquare className="w-5 h-5" />
        <h3 className="font-bold text-lg leading-none">
          {t('dashboard.completedTask')}
        </h3>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
            disabled={currentPage <= 0}
            aria-label={t('dashboard.previousTasks')}
            className="flex items-center justify-center p-1 text-muted border border-default rounded-md hover:text-primary hover:border-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(p + 1, pageCount - 1))}
            disabled={currentPage >= pageCount - 1}
            aria-label={t('dashboard.nextTasks')}
            className="flex items-center justify-center p-1 text-muted border border-default rounded-md hover:text-primary hover:border-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {pageItems.length === 0 ? (
        <p className="text-muted text-sm h-[5rem] flex items-center">
          {t('dashboard.noCompletedTasks')}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {pageItems.map((item) => (
            <CompletedCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── daily-focus strip ─────────────────────────────────────────────────────────

function WeekStrip({
  selectedDate,
  weekOffset,
}: {
  selectedDate: Dayjs;
  weekOffset: number;
}) {
  const { t, i18n } = useTranslation();
  const setSelectedDate = useDateStore((s) => s.setSelectedDate);
  const locale = localeFor(i18n.language);
  const days = Array.from({ length: 7 }, (_, i) =>
    dayjs().add(weekOffset * 7 + i, 'day')
  );

  return (
    <div
      role="tablist"
      aria-label={t('dashboard.weekStrip')}
      className="flex w-full items-center justify-center gap-1.5 sm:gap-2"
    >
      {days.map((day) => {
        const selected = day.isSame(selectedDate, 'day');
        const today = isToday(day);
        return (
          <button
            key={day.format('YYYY-MM-DD')}
            role="tab"
            aria-selected={selected}
            aria-label={day.toDate().toLocaleDateString(locale, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
            onClick={() => setSelectedDate(day)}
            className={`flex w-11 shrink-0 flex-col items-center justify-center h-11 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-accent ${
              selected
                ? 'bg-accent border-accent text-on-accent'
                : 'bg-surface border-default text-primary hover:border-accent'
            }`}
          >
            <span className="text-[0.625rem] uppercase tracking-wide opacity-70">
              {day.toDate().toLocaleDateString(locale, { weekday: 'short' })}
            </span>
            <span className="text-sm font-bold">{day.format('D')}</span>
            {today && !selected && (
              <span
                aria-hidden="true"
                className="mt-0.5 h-1 w-1 rounded-full bg-accent"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

function TodayCompletionRing({
  successful,
  pending,
  total,
}: {
  successful: number;
  pending: number;
  total: number;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-2">
      <DonutChart
        value={successful}
        total={total}
        color="rgb(var(--color-status-complete))"
        dotColor="rgb(var(--color-status-complete))"
        label={t('dashboard.todayCompletion')}
      />
      <div className="flex items-center gap-3 text-xs text-muted">
        <span>{t('dashboard.todayTasksTotal', { count: total })}</span>
        <span>{t('dashboard.todayTasksPending', { count: pending })}</span>
      </div>
    </div>
  );
}

function QuickAddInbox({ inboxCount }: { inboxCount: number }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const addInboxTodo = useAddInboxTodoMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    addInboxTodo.mutate({ name: trimmed });
    setName('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 flex-1 min-w-0"
    >
      <button
        type="button"
        onClick={() => navigate('/tasks')}
        className="flex items-center gap-1.5 text-muted shrink-0 hover:text-primary transition-colors"
      >
        <InboxIcon className="w-4 h-4" />
        <span className="text-sm font-medium hover:underline">
          {t('dashboard.inboxCount', { count: inboxCount })}
        </span>
      </button>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('dashboard.quickAddPlaceholder')}
            inputTestId="dashboard-quick-add-input"
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          className="text-sm shrink-0"
          dataTestId="dashboard-quick-add-submit"
        >
          <Plus className="w-4 h-4" />
          {t('dashboard.quickAdd')}
        </Button>
      </div>
    </form>
  );
}

function DailyFocusStrip({
  todaySuccessful,
  todayPending,
  todayTotal,
  inboxCount,
}: {
  todaySuccessful: number;
  todayPending: number;
  todayTotal: number;
  inboxCount: number;
}) {
  return (
    <div className="bg-surface rounded-xl border border-default p-4 flex flex-col lg:flex-row lg:items-center gap-5">
      <TodayCompletionRing
        successful={todaySuccessful}
        pending={todayPending}
        total={todayTotal}
      />
      <div className="hidden lg:block w-px h-14 bg-default" />
      <QuickAddInbox inboxCount={inboxCount} />
    </div>
  );
}

// ─── top priority panel ─────────────────────────────────────────────────────────

function TopPriorityPanel({ items }: { items: FlatItem[] }) {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const highPriorityItems = items.filter((item) => item.priority === 'high');
  const pageCount = Math.ceil(highPriorityItems.length / 3);
  const currentPage = Math.min(page, Math.max(pageCount - 1, 0));
  const pageItems = highPriorityItems.slice(
    currentPage * 3,
    currentPage * 3 + 3
  );

  return (
    <div className="bg-surface rounded-xl border border-default p-4">
      <div className="flex items-center gap-2 text-primary mb-4">
        <Flame className="w-5 h-5" />
        <h3 className="font-bold text-lg leading-none">
          {t('dashboard.topPriority')}
        </h3>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
            disabled={currentPage <= 0}
            aria-label={t('dashboard.previousTasks')}
            className="flex items-center justify-center p-1 text-muted border border-default rounded-md hover:text-primary hover:border-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(p + 1, pageCount - 1))}
            disabled={currentPage >= pageCount - 1}
            aria-label={t('dashboard.nextTasks')}
            className="flex items-center justify-center p-1 text-muted border border-default rounded-md hover:text-primary hover:border-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {pageItems.length === 0 ? (
        <p className="text-muted text-sm">{t('dashboard.noTopPriority')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {pageItems.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border-l-4 border-l-priority-high-bg bg-surface-subtle p-3"
            >
              <p className="truncate font-semibold text-primary text-sm leading-snug">
                {item.name}
              </p>
              <p className="text-xs text-muted mt-1.5">
                {t('dashboard.status')}{' '}
                <span className={`font-medium ${STATUS_TEXT[item.status]}`}>
                  {t(STATUS_LABEL_KEYS[item.status])}
                </span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

function DashboardPage() {
  const navigate = useNavigate();
  const {
    data: todoLists = [],
    isLoading: isTodoListsLoading,
    isError: isTodoListsError,
    error: todoListsError,
    refetch: refetchTodoLists,
  } = useTodoListsQuery();
  const {
    data: inboxTodos = [],
    isLoading: isInboxLoading,
    isError: isInboxError,
    error: inboxError,
    refetch: refetchInbox,
  } = useInboxTodosQuery();
  const deleteTodoMutation = useDeleteTodoMutation();
  const selectedDate = useDateStore((s) => s.selectedDate);
  const selectedDateStr = toDateStr(selectedDate);
  const todayStr = toDateStr(dayjs());

  const allItems = useMemo(
    () => [...flattenLists(todoLists), ...flattenInbox(inboxTodos)],
    [todoLists, inboxTodos]
  );

  const dateItems = useMemo(
    () => allItems.filter((item) => item.dueDate?.startsWith(selectedDateStr)),
    [allItems, selectedDateStr]
  );

  // Today's completion ring and top-priority panel only count tasks with a
  // due date of today, independent of whichever day is selected in the strip.
  const todayItems = useMemo(
    () => allItems.filter((item) => item.dueDate?.startsWith(todayStr)),
    [allItems, todayStr]
  );
  const todaySuccessful = useMemo(
    () => todayItems.filter((item) => item.status === 'successful').length,
    [todayItems]
  );
  const todayPending = useMemo(
    () => todayItems.filter((item) => item.status === 'pending').length,
    [todayItems]
  );

  const todoItems = useMemo(
    () => dateItems.filter((item) => item.status !== 'successful'),
    [dateItems]
  );

  const successful = useMemo(
    () => dateItems.filter((t) => t.status === 'successful').length,
    [dateItems]
  );
  const pending = useMemo(
    () => dateItems.filter((t) => t.status === 'pending').length,
    [dateItems]
  );
  const failed = useMemo(
    () => dateItems.filter((t) => t.status === 'failed').length,
    [dateItems]
  );

  // Completed tasks always reflect today's completions, independent of
  // whichever day is selected in the calendar strip — a task can't be
  // completed ahead of its due date, so "completed" only ever means "today".
  const completedItems = useMemo(
    () =>
      allItems
        .filter(
          (item) =>
            item.status === 'successful' &&
            item.completedAt?.startsWith(todayStr)
        )
        .sort((a, b) =>
          (b.completedAt ?? '').localeCompare(a.completedAt ?? '')
        ),
    [allItems, todayStr]
  );

  if (isTodoListsLoading || isInboxLoading) {
    return <DashboardSkeleton />;
  }

  if (isTodoListsError || isInboxError) {
    return (
      <ErrorFallback
        error={(todoListsError ?? inboxError) as Error}
        resetErrorBoundary={() => {
          refetchTodoLists();
          refetchInbox();
        }}
        className="max-w-md mx-auto mt-6"
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <DailyFocusStrip
        todaySuccessful={todaySuccessful}
        todayPending={todayPending}
        todayTotal={todayItems.length}
        inboxCount={inboxTodos.length}
      />

      <TopPriorityPanel items={todayItems} />

      <div className="grid min-h-0 grid-cols-1 lg:grid-cols-5 gap-4 flex-1">
        <div className="space-y-4 lg:col-span-2">
          <TaskStatusPanel
            selectedDate={selectedDate}
            successful={successful}
            pending={pending}
            failed={failed}
            total={dateItems.length}
          />
          <CompletedPanel items={completedItems} />
        </div>

        <TodoPanel
          className="lg:col-span-3"
          items={todoItems}
          selectedDate={selectedDate}
          onEditTodo={(item) =>
            navigate('/tasks', {
              state: { todoId: item.id, listId: item.todolistId },
            })
          }
          onDeleteTodo={(item) =>
            deleteTodoMutation.mutate({ id: item.id, image: item.image })
          }
        />
      </div>
    </div>
  );
}

export default DashboardPage;
