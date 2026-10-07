import { useMemo } from 'react';
import dayjs from 'dayjs';
import { AlertTriangle, ClipboardList } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { TodoItem } from '@shared/types';
import {
  useTodoListsQuery,
  useInboxTodosQuery,
  useToggleTodoMutation,
} from '../../fetchers/api';
import { sortByOrder } from '../../lib/reorder';
import {
  daysLate,
  isCompleted,
  isDueLater,
  selectDueToday,
  selectOverdue,
  toggledCompletion,
} from '../../lib/todayTasks';
import TodayHeader from '../dashboard/TodayHeader';
import TodayTaskBlock from '../dashboard/TodayTaskBlock';
import TopPriorityPanel from '../dashboard/TopPriorityPanel';
import TodayStatusPanel from '../dashboard/TodayStatusPanel';
import InboxPanel from '../dashboard/InboxPanel';
import ErrorFallback from '../elements/ErrorFallback';
import TaskSearch from '../elements/TaskSearch';
import DashboardSkeleton from './DashboardSkeleton';

// Both task blocks page instead of growing, so the page does not scroll.
const OVERDUE_PAGE_SIZE = 4;

function DashboardPage() {
  const { t } = useTranslation();
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
  const toggleTodoMutation = useToggleTodoMutation();
  const todayStr = dayjs().format('YYYY-MM-DD');

  const allItems = useMemo(
    () => [...todoLists.flatMap((list) => list.todos), ...inboxTodos],
    [todoLists, inboxTodos]
  );

  // The Inbox is every task without a list. On this page it leaves out the
  // ones that are finished or dated for a later day, which are not today's
  // business. A task due today shows here and under "Due today". Same order
  // as the Inbox on the Tasks page.
  const inboxItems = useMemo(
    () =>
      sortByOrder(inboxTodos).filter(
        (todo) => !isCompleted(todo) && !isDueLater(todo, todayStr)
      ),
    [inboxTodos, todayStr]
  );

  const overdueItems = useMemo(
    () => selectOverdue(allItems, todayStr),
    [allItems, todayStr]
  );
  const todayItems = useMemo(
    () => selectDueToday(allItems, todayStr),
    [allItems, todayStr]
  );

  // The header's progress line and the status donuts count the same tasks:
  // the ones due today.
  const statusCounts = useMemo(
    () => ({
      completed: todayItems.filter(isCompleted).length,
      inProgress: todayItems.filter((item) => item.status === 'pending').length,
      notStarted: todayItems.filter((item) => item.status === 'failed').length,
    }),
    [todayItems]
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

  function handleToggle(item: TodoItem) {
    toggleTodoMutation.mutate({ id: item.id, ...toggledCompletion(item) });
  }

  function handleOpen(item: TodoItem) {
    navigate('/tasks', {
      state: { todoId: item.id, listId: item.todolistId },
    });
  }

  function lateLabel(item: TodoItem) {
    const days = daysLate(item, todayStr);
    return days === 1
      ? t('dashboard.relativeDayAgo')
      : t('dashboard.relativeDaysAgo', { count: days });
  }

  return (
    <div className="flex flex-col gap-4 lg:h-full">
      <TaskSearch inputTestId="dashboard-search" className="lg:hidden" />
      <TodayHeader
        done={statusCounts.completed}
        total={todayItems.length}
        overdue={overdueItems.length}
        onAddTask={() => navigate('/vital', { state: { openAddTask: true } })}
      />

      <TopPriorityPanel items={todayItems} onOpen={handleOpen} />

      {/* On desktop the grid takes the height left above it, so "Due today"
          can measure how many rows fit instead of making the page scroll. */}
      <div className="grid grid-cols-1 gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-5 lg:grid-rows-[minmax(0,1fr)]">
        <div className="flex flex-col gap-4 lg:col-span-3 lg:min-h-0">
          <InboxPanel items={inboxItems} onOpen={handleOpen} />
          <TodayTaskBlock
            title={t('dashboard.dueTodayTitle')}
            icon={<ClipboardList className="h-5 w-5" />}
            items={todayItems}
            emptyMessage={t('dashboard.moodEmpty')}
            pageSize="fit"
            className="lg:min-h-64 lg:flex-1"
            onToggle={handleToggle}
            onOpen={handleOpen}
            dataTestId="today-due"
          />
        </div>

        <div className="flex flex-col gap-4 lg:col-span-2 lg:min-h-0">
          <TodayStatusPanel
            {...statusCounts}
            total={todayItems.length}
            className={overdueItems.length === 0 ? 'lg:flex-1' : undefined}
          />
          {overdueItems.length > 0 && (
            <TodayTaskBlock
              title={t('dashboard.overdueTitle')}
              icon={<AlertTriangle className="h-5 w-5" />}
              hidePriority
              className="lg:min-h-0 lg:flex-1"
              items={overdueItems}
              pageSize={OVERDUE_PAGE_SIZE}
              onOpen={handleOpen}
              renderMeta={(item) => (
                <span className="shrink-0 text-xs font-semibold text-danger">
                  {lateLabel(item)}
                </span>
              )}
              dataTestId="today-overdue"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
