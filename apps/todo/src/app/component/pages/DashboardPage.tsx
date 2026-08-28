import { useMemo, useState, useRef, useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { PieChart, Pie, Cell } from 'recharts';
import {
  ClipboardList,
  Check,
  CheckSquare,
  CalendarDays,
  Flame,
  Inbox as InboxIcon,
  Plus,
} from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/src/style.css';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useNavigate } from 'react-router-dom';
import { TodoItem, TodoList } from '@shared/types';
import {
  useTodoListsQuery,
  useInboxTodosQuery,
  useAddInboxTodoMutation,
} from '../../fetchers/api';
import { useDateStore } from '../../store/dateStore';
import { isDueWithinHours } from '../../lib/urgency';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import TodoItemComponent from '../todo/TodoItem';
import Input from '../elements/Input';
import Button from '../elements/Button';
import ErrorFallback from '../elements/ErrorFallback';
import DashboardSkeleton from './DashboardSkeleton';

// react-day-picker only accepts resolved CSS values for these custom
// properties, so its sizes stay literal px at this integration boundary;
// its colors read our theme tokens via the rgb(var(--color-x)) form.
const DAY_PICKER_STYLE: React.CSSProperties = {
  '--rdp-selected-border': 'none',
  '--rdp-day-width': '50px',
  '--rdp-day-height': '50px',
  '--rdp-day_button-width': '50px',
  '--rdp-day_button-height': '50px',
  '--rdp-accent-color': 'rgb(var(--color-accent))',
  '--rdp-nav_button-width': '36px',
  '--rdp-nav_button-height': '36px',
  fontSize: '14px',
} as React.CSSProperties;

// ─── helpers ────────────────────────────────────────────────────────────────

function toDateStr(d: Dayjs): string {
  return d.format('YYYY-MM-DD');
}

function isToday(d: Dayjs): boolean {
  return d.isSame(dayjs(), 'day');
}

function relativeDate(
  dateStr: string | null | undefined,
  t: TFunction
): string {
  if (!dateStr) return '';
  const diff = dayjs().diff(dayjs(dateStr), 'day');
  if (diff === 0) return t('dashboard.relativeToday');
  if (diff === 1) return t('dashboard.relativeDayAgo');
  return t('dashboard.relativeDaysAgo', { count: diff });
}

function localeFor(language: string): string {
  if (language === 'de') return 'de-DE';
  if (language === 'uk') return 'uk-UA';
  return 'en-US';
}

function startOfWeek(d: Dayjs): Dayjs {
  return d.subtract((d.day() + 6) % 7, 'day');
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
    <div className="rounded-xl border border-default bg-surface p-4">
      <div className="flex items-start gap-3">
        <div
          role="img"
          aria-label={t('dashboard.completed')}
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-status-complete ring-2 ring-inset ring-surface"
        >
          <Check className="h-3.5 w-3.5 text-surface" strokeWidth={3} />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-primary leading-snug">{item.name}</p>
          {item.notes && (
            <p className="text-sm text-muted line-clamp-2 mt-1">{item.notes}</p>
          )}
          <p className="text-xs mt-2 text-muted">
            {t('dashboard.status')}{' '}
            <span className="font-medium text-status-complete">
              {t('dashboard.completed')}
            </span>
          </p>
          {item.completedAt && (
            <p className="text-xs text-muted">
              {relativeDate(item.completedAt, t)}
            </p>
          )}
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
}: {
  items: FlatItem[];
  selectedDate: Dayjs;
  onEditTodo?: (item: FlatItem) => void;
}) {
  const { t, i18n } = useTranslation();
  const dayLabel = selectedDate.format('D MMMM');
  const setSelectedDate = useDateStore((s) => s.setSelectedDate);
  const [pickerDate, setPickerDate] = useState<Date | undefined>(
    selectedDate.toDate()
  );
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const locale = localeFor(i18n.language);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(e.target as Node)
      ) {
        setCalendarOpen(false);
      }
    }
    if (calendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [calendarOpen]);

  return (
    <div className="bg-surface rounded-xl border border-default p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-primary">
          <ClipboardList className="w-5 h-5" />
          <h3 className="font-bold text-lg">{t('dashboard.todo')}</h3>
        </div>

        <div className="relative" ref={calendarRef}>
          <button
            aria-label="Calendar"
            onClick={() => setCalendarOpen((o) => !o)}
            className="flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors"
          >
            <CalendarDays className="w-4 h-4" />
            {dayLabel}
          </button>

          {calendarOpen && (
            <div className="absolute right-0 top-8 z-50 w-[23.625rem] bg-surface rounded-2xl border border-default shadow-menu">
              <div className="flex items-center justify-between px-[0.875rem] pt-4 pb-2">
                <span className="font-bold text-primary">
                  {t('dashboard.calendar')}
                </span>
                <button
                  onClick={() => setCalendarOpen(false)}
                  className="text-muted hover:text-primary transition-colors"
                  aria-label="Close calendar"
                >
                  ✕
                </button>
              </div>

              {pickerDate && (
                <div className="mx-[0.875rem] mb-2 px-3 py-2 rounded-lg border border-default text-sm text-primary">
                  {pickerDate.toLocaleDateString(locale, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              )}

              <DayPicker
                mode="single"
                selected={pickerDate}
                onSelect={(date) => {
                  setPickerDate(date);
                  if (date) setSelectedDate(dayjs(date));
                }}
                weekStartsOn={1}
                navLayout="around"
                showOutsideDays
                style={DAY_PICKER_STYLE}
                modifiersClassNames={{
                  selected:
                    '[&>button]:!bg-accent [&>button]:!text-on-accent [&>button]:!border-0 [&>button]:!rounded-[0.5rem]',
                  today: '[&>button]:!font-bold',
                }}
              />
            </div>
          )}
        </div>
      </div>

      <p className="text-sm text-muted mb-4 flex items-center gap-1.5">
        {isToday(selectedDate) && (
          <>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent" />
            {t('dashboard.today')}
          </>
        )}
      </p>

      {items.length === 0 ? (
        <p className="text-muted text-sm flex-1">
          {t('dashboard.noTasksForDay')}
        </p>
      ) : (
        <div className="space-y-3 overflow-y-auto flex-1">
          {items.map((item) => (
            <TodoItemComponent
              key={item.id}
              todo={item}
              onEdit={onEditTodo ? () => onEditTodo(item) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskStatusPanel({
  successful,
  pending,
  failed,
  total,
}: {
  successful: number;
  pending: number;
  failed: number;
  total: number;
}) {
  const { t } = useTranslation();

  return (
    <div className="bg-surface rounded-xl border border-default p-5">
      <div className="flex items-center gap-2 text-primary mb-5">
        <ClipboardList className="w-5 h-5" />
        <h3 className="font-bold text-lg">{t('dashboard.taskStatus')}</h3>
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

  return (
    <div className="bg-surface rounded-xl border border-default p-5">
      <div className="flex items-center gap-2 text-primary mb-4">
        <CheckSquare className="w-5 h-5" />
        <h3 className="font-bold text-lg">{t('dashboard.completedTask')}</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-muted text-sm">{t('dashboard.noCompletedTasks')}</p>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto">
          {items.map((item) => (
            <CompletedCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── daily-focus strip ─────────────────────────────────────────────────────────

function WeekStrip({ selectedDate }: { selectedDate: Dayjs }) {
  const { t, i18n } = useTranslation();
  const setSelectedDate = useDateStore((s) => s.setSelectedDate);
  const locale = localeFor(i18n.language);
  const weekStart = startOfWeek(selectedDate);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day')),
    [weekStart]
  );

  return (
    <div
      role="tablist"
      aria-label={t('dashboard.weekStrip')}
      className="flex items-center gap-2 overflow-x-auto"
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
            className={`flex flex-col items-center justify-center w-12 h-14 shrink-0 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-accent ${
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
  total,
}: {
  successful: number;
  total: number;
}) {
  const { t } = useTranslation();
  return (
    <DonutChart
      value={successful}
      total={total}
      color="rgb(var(--color-status-complete))"
      dotColor="rgb(var(--color-status-complete))"
      label={t('dashboard.todayCompletion')}
    />
  );
}

function QuickAddInbox({ inboxCount }: { inboxCount: number }) {
  const { t } = useTranslation();
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
      className="flex items-center gap-2 flex-1 min-w-[15rem]"
    >
      <div className="flex items-center gap-1.5 text-muted shrink-0">
        <InboxIcon className="w-4 h-4" />
        <span className="text-sm font-medium">
          {t('dashboard.inboxCount', { count: inboxCount })}
        </span>
      </div>
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
    </form>
  );
}

function DailyFocusStrip({
  selectedDate,
  todaySuccessful,
  todayTotal,
  inboxCount,
}: {
  selectedDate: Dayjs;
  todaySuccessful: number;
  todayTotal: number;
  inboxCount: number;
}) {
  return (
    <div className="bg-surface rounded-xl border border-default p-5 flex flex-col lg:flex-row lg:items-center gap-5">
      <WeekStrip selectedDate={selectedDate} />
      <div className="hidden lg:block w-px h-14 bg-default" />
      <TodayCompletionRing successful={todaySuccessful} total={todayTotal} />
      <div className="hidden lg:block w-px h-14 bg-default" />
      <QuickAddInbox inboxCount={inboxCount} />
    </div>
  );
}

// ─── top priority panel ─────────────────────────────────────────────────────────

function TopPriorityPanel({ items }: { items: FlatItem[] }) {
  const { t } = useTranslation();
  const prefersReducedMotion = usePrefersReducedMotion();
  const topThree = items.filter((item) => item.priority === 'high').slice(0, 3);

  return (
    <div className="bg-surface rounded-xl border border-default p-5">
      <div className="flex items-center gap-2 text-primary mb-4">
        <Flame className="w-5 h-5" />
        <h3 className="font-bold text-lg">{t('dashboard.topPriority')}</h3>
      </div>
      {topThree.length === 0 ? (
        <p className="text-muted text-sm">{t('dashboard.noTopPriority')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {topThree.map((item) => {
            const isUrgent =
              item.status === 'pending' && isDueWithinHours(item.dueDate);
            return (
              <div
                key={item.id}
                className="rounded-xl border border-priority-high-bg/40 bg-priority-high-bg/5 p-3"
              >
                <p className="font-semibold text-primary text-sm leading-snug line-clamp-2">
                  {item.name}
                </p>
                {item.dueDate && (
                  <p
                    className={`flex items-center gap-1 text-xs mt-1.5 ${
                      isUrgent ? 'text-danger font-semibold' : 'text-muted'
                    }`}
                  >
                    {isUrgent && (
                      <span
                        aria-hidden="true"
                        className={`h-1.5 w-1.5 rounded-full bg-danger ${
                          prefersReducedMotion ? '' : 'animate-pulse'
                        }`}
                      />
                    )}
                    {dayjs(item.dueDate).format('DD/MM/YYYY')}
                    {isUrgent && (
                      <span className="rounded-full bg-danger/10 px-1.5 py-0.5 text-[0.625rem] font-semibold text-danger">
                        {t('tasks.dueSoon')}
                      </span>
                    )}
                  </p>
                )}
              </div>
            );
          })}
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
  const selectedDate = useDateStore((s) => s.selectedDate);
  const selectedDateStr = toDateStr(selectedDate);
  const todayStr = toDateStr(dayjs());

  const allItems = useMemo(
    () => [...flattenLists(todoLists), ...flattenInbox(inboxTodos)],
    [todoLists, inboxTodos]
  );

  const dateItems = useMemo(
    () =>
      allItems.filter((item) =>
        item.dueDate
          ? item.dueDate.startsWith(selectedDateStr)
          : isToday(selectedDate)
      ),
    [allItems, selectedDateStr, selectedDate]
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

  const completedItems = useMemo(
    () =>
      dateItems
        .filter((t) => t.status === 'successful')
        .sort((a, b) =>
          (b.completedAt ?? '').localeCompare(a.completedAt ?? '')
        )
        .slice(0, 5),
    [dateItems]
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
    <div className="flex flex-col gap-6 h-full">
      <DailyFocusStrip
        selectedDate={selectedDate}
        todaySuccessful={todaySuccessful}
        todayTotal={todayItems.length}
        inboxCount={inboxTodos.length}
      />

      <TopPriorityPanel items={todayItems} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        <TodoPanel
          items={todoItems}
          selectedDate={selectedDate}
          onEditTodo={(item) =>
            navigate('/tasks', {
              state: { todoId: item.id, listId: item.todolistId },
            })
          }
        />

        <div className="space-y-6">
          <TaskStatusPanel
            successful={successful}
            pending={pending}
            failed={failed}
            total={dateItems.length}
          />
          <CompletedPanel items={completedItems} />
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
