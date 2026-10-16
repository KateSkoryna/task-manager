import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { detectTimezone, inZone, TodoItem, TodoList } from '@shared/types';
import { useTodoListsData } from '../../hooks/useTodoListsData';
import { usePreferences } from '../../hooks/usePreferences';
import { useIsBelowXlScreen } from '../../hooks/useIsBelowXlScreen';
import { useFlatSortOptions } from '../../hooks/useFlatSortOptions';
import { sortFlatEntries } from '../../lib/sortTasks';
import { useListViewStore } from '../../store/listViewStore';
import {
  PeriodKind,
  resolvePeriod,
  shiftPeriod,
} from '../statistics/lib/periods';
import { mergeClassNames } from '../../lib/classNames';
import FlatTaskList from '../todo/FlatTaskList';
import SortMenu from '../todo/SortMenu';
import PeriodSelector from '../elements/PeriodSelector';
import Dropdown from '../elements/Dropdown';
import PeriodNavigator from '../statistics/components/PeriodNavigator';
import { TaskDetailPanel } from '../todo/TaskSidePanel';
import TaskPanelBar from '../todo/TaskPanelBar';
import SelectTaskPlaceholder from '../todo/SelectTaskPlaceholder';
import PomodoroTimer from '../todo/PomodoroTimer';
import VitalTaskPageSkeleton from './VitalTaskPageSkeleton';

type SelectedTask = {
  todo: TodoItem;
  list: TodoList | null;
};

function VitalTaskPage() {
  const { t } = useTranslation();
  const isBelowXl = useIsBelowXlScreen();
  const { preferences } = usePreferences();
  const navigate = useNavigate();
  const {
    todoLists,
    inboxTodos,
    isLoading,
    handleDeleteTodo,
    handleToggleTodo,
    handleArchiveTodo,
  } = useTodoListsData();

  const [selectedTask, setSelectedTask] = useState<SelectedTask | null>(null);

  const flatSort = useListViewStore((state) => state.vitalFlatSort);
  const setFlatSort = useListViewStore((state) => state.setVitalFlatSort);
  const flatSortOptions = useFlatSortOptions();

  const zone = preferences?.timezone ?? detectTimezone();
  const [periodKind, setPeriodKind] = useState<PeriodKind>('month');
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const period = useMemo(
    () => resolvePeriod(periodKind, anchor, zone),
    [periodKind, anchor, zone]
  );

  // Vital Tasks is a working view of what's still actionable — every
  // high-priority task due in the chosen period. Done tasks stay visible on
  // the regular Tasks page, not here.
  const vitalEntries = useMemo(() => {
    const entries = [
      ...(todoLists ?? []).flatMap((list) =>
        list.todos.map((todo) => ({ todo, listId: list.id as string | null }))
      ),
      ...inboxTodos.map((todo) => ({ todo, listId: null })),
    ].filter(
      ({ todo }) =>
        todo.priority === 'high' &&
        todo.status === 'pending' &&
        todo.dueDate &&
        new Date(todo.dueDate) >= period.start &&
        new Date(todo.dueDate) <= period.end
    );
    const listNames = new Map((todoLists ?? []).map((l) => [l.id, l.name]));
    return sortFlatEntries(entries, flatSort, listNames);
  }, [todoLists, inboxTodos, period, flatSort]);

  const periodOptions = [
    { label: t('statistics.week'), value: 'week' as const },
    { label: t('statistics.month'), value: 'month' as const },
    { label: t('statistics.year'), value: 'year' as const },
  ];

  const hasTasks = vitalEntries.length > 0;
  const showDetail = hasTasks && selectedTask !== null;

  const rangeLabel = useMemo(() => {
    const start = inZone(period.start, zone);
    const end = inZone(period.end, zone);
    if (period.kind === 'year') return start.format('YYYY');
    if (period.kind === 'month') return start.format('MMMM YYYY');
    return `${start.format('MMM D')} – ${end.format('MMM D, YYYY')}`;
  }, [period, zone]);

  function handlePeriodChange(kind: PeriodKind) {
    setPeriodKind(kind);
    setAnchor(new Date());
  }

  function resolveList(listId: string | null): TodoList | null {
    return (todoLists ?? []).find((l) => l.id === listId) ?? null;
  }

  function handleSelectTodo(todo: TodoItem, list: TodoList | null) {
    setSelectedTask((prev) =>
      prev?.todo.id === todo.id ? null : { todo, list }
    );
  }

  // See TasksPage's identical effect: bring the selected row back into view
  // in the (possibly long) left list whenever the selection changes.
  useEffect(() => {
    if (!selectedTask) return;
    document
      .querySelector(`[data-testid="todo-item-${selectedTask.todo.id}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTask?.todo.id]);

  function handleArchiveSelectedTodo(id: string) {
    handleArchiveTodo(id);
    setSelectedTask(null);
  }

  function handleDeleteSelectedTodo(id: string) {
    handleDeleteTodo(id);
    setSelectedTask(null);
  }

  if (isLoading) {
    return <VitalTaskPageSkeleton />;
  }

  return (
    <div className="-mx-content-mobile -mb-content-mobile grid min-h-full grid-cols-1 gap-6 md:-mx-content-tablet md:-mb-content-tablet lg:-mx-content-desktop lg:-mb-content-desktop md:grid-cols-[1.08fr_0.92fr] lg:grid-cols-[1.2fr_0.8fr]">
      {/* Left panel: list — hidden on mobile once a task is selected, since
          the detail view replaces it as its own screen there. */}
      <div
        className={mergeClassNames(
          'flex-col overflow-y-auto pl-content-mobile pr-content-mobile pb-content-mobile md:pl-content-tablet md:pr-0 md:pb-content-tablet lg:pl-content-desktop lg:pb-content-desktop md:flex',
          showDetail ? 'hidden' : 'flex'
        )}
      >
        <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex justify-center sm:justify-start">
            <PeriodNavigator
              rangeLabel={rangeLabel}
              onPrevious={() => setAnchor(shiftPeriod(period, -1).start)}
              onNext={() => setAnchor(shiftPeriod(period, 1).start)}
              previousLabel={t('statistics.previousPeriod')}
              nextLabel={t('statistics.nextPeriod')}
            />
          </div>
          <div className="flex w-full flex-nowrap items-center gap-2 sm:w-auto sm:gap-3">
            {isBelowXl ? (
              <div className="min-w-0 flex-1 sm:w-40 sm:flex-none">
                <Dropdown
                  ariaLabel={t('statistics.period')}
                  value={periodKind}
                  onChange={(value) => value && handlePeriodChange(value)}
                  options={periodOptions}
                  placeholder={t('statistics.period')}
                />
              </div>
            ) : (
              <PeriodSelector
                ariaLabel={t('statistics.period')}
                options={periodOptions}
                value={periodKind}
                onChange={handlePeriodChange}
                className="min-w-0 flex-1 sm:flex-none"
              />
            )}
            <SortMenu
              value={flatSort}
              onChange={setFlatSort}
              options={flatSortOptions}
            />
          </div>
        </div>

        {hasTasks ? (
          <FlatTaskList
            entries={vitalEntries}
            selectedTodoId={selectedTask?.todo.id ?? null}
            onSelectTodo={(todo, listId) =>
              handleSelectTodo(todo, resolveList(listId))
            }
            onToggleTodo={handleToggleTodo}
            availableLists={[]}
          />
        ) : (
          <div
            className="rounded-card border border-default bg-surface p-6 text-center text-muted text-body shadow-card"
            data-testid="empty-vital-tasks"
          >
            {t('tasks.emptyVitalView')}
          </div>
        )}
      </div>

      {/* Right panel: detail — its own full-width screen on mobile, a
          side-by-side column from tablet up. */}
      <div
        className={mergeClassNames(
          'flex-col pl-content-mobile pr-content-mobile pb-content-mobile md:pl-0 md:pr-content-tablet md:pb-content-tablet lg:pr-content-desktop lg:pb-content-desktop md:flex md:sticky md:top-0 md:self-start',
          showDetail ? 'flex' : 'hidden'
        )}
      >
        <div className="flex flex-col flex-1 rounded-card border border-default bg-surface shadow-card overflow-hidden">
          {selectedTask ? (
            <>
              <TaskPanelBar
                todoId={selectedTask.todo.id}
                onBack={() => setSelectedTask(null)}
                onArchive={() =>
                  handleArchiveSelectedTodo(selectedTask.todo.id)
                }
                onDelete={() => handleDeleteSelectedTodo(selectedTask.todo.id)}
              />
              {selectedTask.todo.status === 'pending' && (
                <div className="px-6 pt-6">
                  <PomodoroTimer
                    key={selectedTask.todo.id}
                    taskName={selectedTask.todo.name}
                  />
                </div>
              )}
              <TaskDetailPanel
                todo={selectedTask.todo}
                list={selectedTask.list}
                onStartEdit={() =>
                  navigate('/tasks', {
                    state: {
                      todoId: selectedTask.todo.id,
                      listId: selectedTask.list?.id,
                    },
                  })
                }
              />
            </>
          ) : (
            <SelectTaskPlaceholder
              message={hasTasks ? undefined : t('tasks.emptyVitalView')}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default VitalTaskPage;
