import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { TodoItem, TodoList } from '@shared/types';
import { useTodoListsData } from '../../hooks/useTodoListsData';
import TodoLists from '../todo/TodoLists';
import { TaskDetailPanel } from '../todo/TaskSidePanel';
import VitalTaskHero, { VitalTodoEntry } from '../todo/VitalTaskHero';

type SelectedTask = {
  todo: TodoItem;
  list: TodoList;
};

function compareVitalEntries(a: VitalTodoEntry, b: VitalTodoEntry): number {
  if (a.todo.dueDate && b.todo.dueDate) {
    return dayjs(a.todo.dueDate).valueOf() - dayjs(b.todo.dueDate).valueOf();
  }
  if (a.todo.dueDate) return -1;
  if (b.todo.dueDate) return 1;
  return a.todo.name.localeCompare(b.todo.name);
}

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
    handleToggleTodo,
  } = useTodoListsData();

  const [selectedTask, setSelectedTask] = useState<SelectedTask | null>(null);

  const vitalLists = todoLists?.filter((l) => l.priority === 'high');

  const vitalTodoEntries: VitalTodoEntry[] = (vitalLists ?? [])
    .flatMap((list) =>
      list.todos
        .filter((todo) => todo.status === 'pending')
        .map((todo) => ({ todo, list }))
    )
    .sort(compareVitalEntries);
  const topThreeVitalTodos = vitalTodoEntries.slice(0, 3);

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

  return (
    <div className="flex min-h-full -m-6">
      {/* Left panel */}
      <div className="flex flex-col w-1/2 border-r border-secondary-bg p-6 overflow-y-auto">
        <p className="text-secondary-dark-bg text-sm mb-4">
          {t('vitalTask.description')}
        </p>
        <VitalTaskHero
          entries={topThreeVitalTodos}
          totalVitalCount={vitalTodoEntries.length}
          selectedTodoId={selectedTask?.todo.id ?? null}
          onSelect={handleSelectTodo}
          onToggleComplete={handleToggleTodo}
        />
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
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-secondary-dark-bg gap-3 p-6">
            <ClipboardList className="w-16 h-16 opacity-20" />
            <p className="text-base font-medium opacity-40">
              {t('tasks.selectTask')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default VitalTaskPage;
