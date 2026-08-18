import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, ClipboardList, Rows3, LayoutList } from 'lucide-react';
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
import { computeReorder } from '../../lib/reorder';
import TodoListForm from '../todo/TodoListForm';
import TodoLists from '../todo/TodoLists';
import InboxSection from '../todo/InboxSection';
import FlatTaskList, { FlatEntry } from '../todo/FlatTaskList';
import { TaskDetailPanel, TodoEditPanel } from '../todo/TaskSidePanel';

type CreateListOpts = {
  priority?: TodoListPriority;
  category?: TodoListCategory;
  dueDate?: string | null;
  notes?: string | null;
};

type SelectedTask = {
  todo: TodoItem;
  list: TodoList | null;
};

type LocationState = {
  todoId?: string;
  listId?: string;
} | null;

type ViewMode = 'grouped' | 'flat';

// ─── Page ─────────────────────────────────────────────────────────────────────

function TasksPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const locationState = (location.state as LocationState) ?? null;

  const {
    todoLists,
    inboxTodos,
    isLoading,
    isError,
    error,
    refetch,
    handleCreateList,
    handleDeleteList,
    handleEditList,
    handleAddTodo,
    handleAddInboxTodo,
    handleDeleteTodo,
    handleEditTodo,
    createListMutationIsPending,
  } = useTodoListsData();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<SelectedTask | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');

  const availableLists = useMemo(
    () => (todoLists ?? []).map((list) => ({ id: list.id, name: list.name })),
    [todoLists]
  );

  const flatEntries: FlatEntry[] = useMemo(() => {
    const listEntries = (todoLists ?? []).flatMap((list) =>
      list.todos.map((todo) => ({ todo, listId: list.id }))
    );
    const inboxEntries = inboxTodos.map((todo) => ({ todo, listId: null }));
    return [...listEntries, ...inboxEntries].sort((a, b) => {
      const dueA = a.todo.dueDate;
      const dueB = b.todo.dueDate;
      if (dueA !== dueB) {
        if (!dueA) return 1;
        if (!dueB) return -1;
        return dueA.localeCompare(dueB);
      }
      return a.todo.name.localeCompare(b.todo.name);
    });
  }, [todoLists, inboxTodos]);

  // Auto-select + open edit when navigated from another page with state
  const initialStateHandled = useRef(false);
  useEffect(() => {
    if (initialStateHandled.current || !locationState?.todoId) return;

    if (locationState.listId) {
      if (!todoLists?.length) return;
      const list = todoLists.find((l) => l.id === locationState.listId);
      const todo = list?.todos.find((t) => t.id === locationState.todoId);
      if (todo && list) {
        setSelectedTask({ todo, list });
        setIsEditing(true);
        initialStateHandled.current = true;
      }
    } else {
      const todo = inboxTodos.find((t) => t.id === locationState.todoId);
      if (todo) {
        setSelectedTask({ todo, list: null });
        setIsEditing(true);
        initialStateHandled.current = true;
      }
    }
  }, [locationState, todoLists, inboxTodos]);

  function handleCreateListSubmit(name: string, opts?: CreateListOpts) {
    handleCreateList(name, opts);
    setShowCreateForm(false);
  }

  function handleSelectTodo(todo: TodoItem, list: TodoList | null) {
    setSelectedTask((prev) =>
      prev?.todo.id === todo.id ? null : { todo, list }
    );
    setIsEditing(false);
  }

  function handleEditTodoInline(todo: TodoItem, list: TodoList | null) {
    setSelectedTask({ todo, list });
    setIsEditing(true);
  }

  function resolveList(listId: string | null): TodoList | null {
    if (!listId) return null;
    return todoLists?.find((l) => l.id === listId) ?? null;
  }

  function handleDeleteSelectedTodo(id: string) {
    handleDeleteTodo(id);
    setSelectedTask(null);
    setIsEditing(false);
  }

  function handleReorderTodo(id: string, direction: 'up' | 'down') {
    const list = todoLists?.find((l) => l.todos.some((t) => t.id === id));
    const siblings = list ? list.todos : inboxTodos;
    computeReorder(siblings, id, direction).forEach(({ id: todoId, order }) =>
      handleEditTodo(todoId, { order })
    );
  }

  function handleMoveTodo(id: string, todolistId: string | null) {
    handleEditTodo(id, { todolistId });
    setSelectedTask((prev) =>
      prev && prev.todo.id === id
        ? { todo: { ...prev.todo, todolistId }, list: resolveList(todolistId) }
        : prev
    );
  }

  function handleSaveEdit(
    todoUpdates: UpdateTodoItem,
    listUpdates: UpdateTodoList | null
  ) {
    if (!selectedTask) return;
    const previousTodo = selectedTask.todo;
    handleEditTodo(selectedTask.todo.id, todoUpdates, () => {
      // Revert the optimistic patch below if the save actually failed,
      // so a stale (possibly deleted) image URL doesn't linger in the UI.
      setSelectedTask((prev) =>
        prev && prev.todo.id === previousTodo.id
          ? { ...prev, todo: previousTodo }
          : prev
      );
    });
    if (listUpdates && selectedTask.list) {
      handleEditList(selectedTask.list.id, listUpdates);
    }
    setSelectedTask((prev) =>
      prev
        ? {
            todo: { ...prev.todo, ...todoUpdates },
            list:
              listUpdates && prev.list
                ? { ...prev.list, ...listUpdates }
                : prev.list,
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
            <div className="flex items-center gap-2">
              <div
                role="group"
                aria-label={t('tasks.viewMode')}
                className="flex items-center border border-secondary-bg rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setViewMode('grouped')}
                  aria-pressed={viewMode === 'grouped'}
                  className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    viewMode === 'grouped'
                      ? 'bg-accent text-dark-bg'
                      : 'bg-white text-secondary-dark-bg hover:text-dark-bg'
                  }`}
                >
                  <Rows3 className="w-3.5 h-3.5" />
                  {t('tasks.groupedView')}
                </button>
                <button
                  onClick={() => setViewMode('flat')}
                  aria-pressed={viewMode === 'flat'}
                  className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border-l border-secondary-bg transition-colors ${
                    viewMode === 'flat'
                      ? 'bg-accent text-dark-bg'
                      : 'bg-white text-secondary-dark-bg hover:text-dark-bg'
                  }`}
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  {t('tasks.flatView')}
                </button>
              </div>
              <button
                onClick={() => setShowCreateForm((v) => !v)}
                className="flex items-center gap-1.5 px-4 py-2 bg-triadic-orange text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                {t('tasks.newList')}
              </button>
            </div>
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

        <div className="flex-1 px-6 pb-6 space-y-4">
          {viewMode === 'grouped' ? (
            <>
              <InboxSection
                todos={inboxTodos}
                onAddTodo={handleAddInboxTodo}
                selectedTodoId={selectedTask?.todo.id ?? null}
                onSelectTodo={(todo) => handleSelectTodo(todo, null)}
                onEditTodo={(todo) => handleEditTodoInline(todo, null)}
                availableLists={availableLists}
                onReorderTodo={handleReorderTodo}
                onMoveTodo={handleMoveTodo}
              />
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
                availableLists={availableLists}
                onReorderTodo={handleReorderTodo}
                onMoveTodo={handleMoveTodo}
              />
            </>
          ) : (
            <FlatTaskList
              entries={flatEntries}
              selectedTodoId={selectedTask?.todo.id ?? null}
              onSelectTodo={(todo, listId) =>
                handleSelectTodo(todo, resolveList(listId))
              }
              onEditTodo={(todo, listId) =>
                handleEditTodoInline(todo, resolveList(listId))
              }
              availableLists={availableLists}
              onMoveTodo={handleMoveTodo}
            />
          )}
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
              onDelete={(id) => handleDeleteSelectedTodo(id)}
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
