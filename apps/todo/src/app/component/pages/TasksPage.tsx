import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, ClipboardList } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  TodoItem,
  TodoList,
  TodoListPriority,
  TodoListCategory,
  UpdateTodoItem,
  UpdateTodoList,
} from '@shared/types';
import { useTodoListsData } from '../../hooks/useTodoListsData';
import TodoListForm from '../todo/TodoListForm';
import TodoLists from '../todo/TodoLists';
import { TaskDetailPanel, TodoEditPanel } from '../todo/TaskSidePanel';

type CreateListOpts = {
  priority?: TodoListPriority;
  category?: TodoListCategory;
  dueDate?: string | null;
  notes?: string | null;
};

type SelectedTask = {
  todo: TodoItem;
  list: TodoList;
};

type LocationState = {
  todoId?: string;
  listId?: string;
} | null;

// ─── Page ─────────────────────────────────────────────────────────────────────

function TasksPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const locationState = (location.state as LocationState) ?? null;

  const {
    todoLists,
    isLoading,
    isError,
    error,
    refetch,
    handleCreateList,
    handleDeleteList,
    handleEditList,
    handleAddTodo,
    handleDeleteTodo,
    handleEditTodo,
    createListMutationIsPending,
  } = useTodoListsData();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<SelectedTask | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Auto-select + open edit when navigated from another page with state
  const initialStateHandled = useRef(false);
  useEffect(() => {
    if (
      initialStateHandled.current ||
      !locationState?.todoId ||
      !todoLists?.length
    )
      return;
    const list = todoLists.find((l) => l.id === locationState.listId);
    const todo = list?.todos.find((t) => t.id === locationState.todoId);
    if (todo && list) {
      setSelectedTask({ todo, list });
      setIsEditing(true);
      initialStateHandled.current = true;
    }
  }, [locationState, todoLists]);

  function handleCreateListSubmit(name: string, opts?: CreateListOpts) {
    handleCreateList(name, opts);
    setShowCreateForm(false);
  }

  function handleSelectTodo(todo: TodoItem, list: TodoList) {
    setSelectedTask((prev) =>
      prev?.todo.id === todo.id ? null : { todo, list }
    );
    setIsEditing(false);
  }

  function handleEditTodoInline(todo: TodoItem, list: TodoList) {
    setSelectedTask({ todo, list });
    setIsEditing(true);
  }

  function handleDeleteSelectedTodo(id: string, listId: string) {
    handleDeleteTodo(id, listId);
    setSelectedTask(null);
    setIsEditing(false);
  }

  function handleSaveEdit(
    todoUpdates: UpdateTodoItem,
    listUpdates: UpdateTodoList
  ) {
    if (!selectedTask) return;
    const previousTodo = selectedTask.todo;
    handleEditTodo(
      selectedTask.todo.id,
      selectedTask.list.id,
      todoUpdates,
      () => {
        // Revert the optimistic patch below if the save actually failed,
        // so a stale (possibly deleted) image URL doesn't linger in the UI.
        setSelectedTask((prev) =>
          prev && prev.todo.id === previousTodo.id
            ? { ...prev, todo: previousTodo }
            : prev
        );
      }
    );
    handleEditList(selectedTask.list.id, listUpdates);
    setSelectedTask((prev) =>
      prev
        ? {
            todo: { ...prev.todo, ...todoUpdates },
            list: { ...prev.list, ...listUpdates },
          }
        : null
    );
    setIsEditing(false);
  }

  return (
    <div className="flex min-h-full -m-6">
      {/* Left panel */}
      <div className="flex flex-col w-1/2 border-r border-secondary-bg">
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-2xl font-bold text-dark-bg">
                {t('tasks.myTasks')}
              </h2>
              <div className="h-0.5 w-14 bg-triadic-orange mt-1.5" />
            </div>
            <button
              onClick={() => setShowCreateForm((v) => !v)}
              className="flex items-center gap-1.5 px-4 py-2 bg-triadic-orange text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              {t('tasks.newList')}
            </button>
          </div>

          {showCreateForm && (
            <div className="mt-4">
              <TodoListForm
                onSubmit={handleCreateListSubmit}
                isSubmitting={createListMutationIsPending}
              />
            </div>
          )}
        </div>

        <div className="flex-1 px-6 pb-6">
          <TodoLists
            todoLists={todoLists}
            isLoading={isLoading}
            isError={isError}
            error={error}
            refetch={refetch}
            handleDeleteList={handleDeleteList}
            handleAddTodo={handleAddTodo}
            selectedTodoId={selectedTask?.todo.id ?? null}
            onSelectTodo={handleSelectTodo}
            onEditTodo={handleEditTodoInline}
          />
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-col w-1/2">
        {selectedTask ? (
          isEditing ? (
            <TodoEditPanel
              todo={selectedTask.todo}
              list={selectedTask.list}
              onSave={handleSaveEdit}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <TaskDetailPanel
              todo={selectedTask.todo}
              list={selectedTask.list}
              onDelete={(id) =>
                handleDeleteSelectedTodo(id, selectedTask.list.id)
              }
              onStartEdit={() => setIsEditing(true)}
            />
          )
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

export default TasksPage;
