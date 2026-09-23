import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TodoItem, TodoList } from '@shared/types';
import { useTodoListsData } from '../../hooks/useTodoListsData';
import { mergeClassNames } from '../../lib/classNames';
import TodoLists from '../todo/TodoLists';
import { TaskDetailPanel } from '../todo/TaskSidePanel';
import SelectTaskPlaceholder from '../todo/SelectTaskPlaceholder';
import PomodoroTimer from '../todo/PomodoroTimer';
import IconButton from '../elements/IconButton';
import VitalTaskPageSkeleton from './VitalTaskPageSkeleton';

type SelectedTask = {
  todo: TodoItem;
  list: TodoList;
};

function VitalTaskPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    todoLists,
    isLoading,
    isError,
    error,
    refetch,
    handleDeleteList,
    handleAddTodo,
    handleDeleteTodo,
  } = useTodoListsData();

  const [selectedTask, setSelectedTask] = useState<SelectedTask | null>(null);

  // Vital Tasks is a working view of what's still actionable — done tasks
  // stay visible on the regular Tasks page, not here.
  const vitalLists = todoLists
    ?.filter((l) => l.priority === 'high')
    .map((list) => ({
      ...list,
      todos: list.todos.filter((todo) => todo.status === 'pending'),
    }));

  function handleSelectTodo(todo: TodoItem, list: TodoList) {
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

  function handleDeleteSelectedTodo(id: string) {
    handleDeleteTodo(id);
    setSelectedTask(null);
  }

  function handleDeleteTodoFromList(id: string) {
    if (selectedTask?.todo.id === id) {
      handleDeleteSelectedTodo(id);
    } else {
      handleDeleteTodo(id);
    }
  }

  if (isLoading) {
    return <VitalTaskPageSkeleton />;
  }

  return (
    <div className="-mx-content-mobile -mb-content-mobile grid min-h-full grid-cols-1 gap-6 pt-6 md:-mx-content-tablet md:-mb-content-tablet lg:-mx-content-desktop lg:-mb-content-desktop md:grid-cols-[1.08fr_0.92fr] lg:grid-cols-[1.2fr_0.8fr]">
      {/* Left panel: list — hidden on mobile once a task is selected, since
          the detail view replaces it as its own screen there. */}
      <div
        className={mergeClassNames(
          'flex-col overflow-y-auto pl-content-mobile pr-content-mobile pb-content-mobile md:pl-content-tablet md:pr-0 md:pb-content-tablet lg:pl-content-desktop lg:pb-content-desktop md:flex',
          selectedTask ? 'hidden' : 'flex'
        )}
      >
        <TodoLists
          todoLists={vitalLists}
          isLoading={isLoading}
          isError={isError}
          error={error}
          refetch={refetch}
          handleDeleteList={handleDeleteList}
          handleAddTodo={handleAddTodo}
          selectedTodoId={selectedTask?.todo.id ?? null}
          onSelectTodo={handleSelectTodo}
          onDeleteTodo={(todo) => handleDeleteTodoFromList(todo.id)}
          onCreateList={() =>
            navigate('/tasks', { state: { openCreateList: true } })
          }
        />
      </div>

      {/* Right panel: detail — its own full-width screen on mobile, a
          side-by-side column from tablet up. */}
      <div
        className={mergeClassNames(
          'flex-col pl-content-mobile pr-content-mobile pb-content-mobile md:pl-0 md:pr-content-tablet md:pb-content-tablet lg:pr-content-desktop lg:pb-content-desktop md:flex md:sticky md:top-0 md:self-start',
          selectedTask ? 'flex' : 'hidden'
        )}
      >
        <div className="flex flex-col flex-1 rounded-card border border-default bg-surface shadow-card overflow-hidden">
          {selectedTask ? (
            <>
              <div className="border-b border-default p-3 md:hidden">
                <IconButton
                  ariaLabel={t('tasks.backToList')}
                  onClick={() => setSelectedTask(null)}
                >
                  <ArrowLeft className="size-4" />
                </IconButton>
              </div>
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
                onDelete={(id) => handleDeleteSelectedTodo(id)}
                onStartEdit={() =>
                  navigate('/tasks', {
                    state: {
                      todoId: selectedTask.todo.id,
                      listId: selectedTask.list.id,
                    },
                  })
                }
              />
            </>
          ) : (
            <SelectTaskPlaceholder />
          )}
        </div>
      </div>
    </div>
  );
}

export default VitalTaskPage;
