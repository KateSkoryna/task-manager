import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TodoItem, TodoList } from '@shared/types';
import { useTodoListsData } from '../../hooks/useTodoListsData';
import TodoLists from '../todo/TodoLists';
import { TaskDetailPanel } from '../todo/TaskSidePanel';
import SelectTaskPlaceholder from '../todo/SelectTaskPlaceholder';
import PomodoroTimer from '../todo/PomodoroTimer';
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

  function handleEditTodo(todo: TodoItem) {
    navigate('/tasks', { state: { todoId: todo.id, listId: todo.todolistId } });
  }

  if (isLoading) {
    return <VitalTaskPageSkeleton />;
  }

  return (
    <div className="flex min-h-full -m-6">
      {/* Left panel */}
      <div className="flex flex-col w-1/2 border-r border-secondary-bg p-6 overflow-y-auto">
        <p className="text-secondary-dark-bg text-sm mb-4">
          {t('vitalTask.description')}
        </p>
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
          onEditTodo={(todo) => handleEditTodo(todo)}
          onCreateList={() =>
            navigate('/tasks', { state: { openCreateList: true } })
          }
        />
      </div>

      {/* Right panel */}
      <div className="flex flex-col w-1/2">
        {selectedTask ? (
          <>
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
  );
}

export default VitalTaskPage;
