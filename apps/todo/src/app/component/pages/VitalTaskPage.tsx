import { useState } from 'react';
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
    <div className="-m-6 grid min-h-full grid-cols-1 gap-6 md:grid-cols-[1.08fr_0.92fr] lg:grid-cols-[1.2fr_0.8fr]">
      {/* Left panel: list — hidden on mobile once a task is selected, since
          the detail view replaces it as its own screen there. */}
      <div
        className={mergeClassNames(
          'flex-col overflow-y-auto p-6 md:pr-0 md:flex',
          selectedTask ? 'hidden' : 'flex'
        )}
      >
        <p className="text-muted text-sm mb-4">{t('vitalTask.description')}</p>
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
          'flex-col md:flex md:sticky md:top-6 md:self-start md:pt-6',
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
