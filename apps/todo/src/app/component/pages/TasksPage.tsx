import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Rows3, LayoutList, ArrowLeft } from 'lucide-react';
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
import { mergeClassNames } from '../../lib/classNames';
import TodoListForm from '../todo/TodoListForm';
import TodoLists from '../todo/TodoLists';
import InboxSection from '../todo/InboxSection';
import FlatTaskList, { FlatEntry } from '../todo/FlatTaskList';
import SelectTaskPlaceholder from '../todo/SelectTaskPlaceholder';
import { TaskDetailPanel, TodoEditPanel } from '../todo/TaskSidePanel';
import TasksPageSkeleton from './TasksPageSkeleton';
import Button from '../elements/Button';
import IconButton from '../elements/IconButton';

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
  openCreateList?: boolean;
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

  // Auto-select + open edit when navigated from another page with state.
  // Tracks the last *navigation* handled (by history key), not just the last
  // todoId, so navigating to the same task twice in a row (e.g. clicking the
  // same header search result again) still re-opens it rather than being
  // silently swallowed by a one-shot guard.
  const lastHandledKey = useRef<string | null>(null);
  useEffect(() => {
    if (!locationState?.todoId || lastHandledKey.current === location.key) {
      return;
    }

    if (locationState.listId) {
      if (!todoLists?.length) return;
      const list = todoLists.find((l) => l.id === locationState.listId);
      const todo = list?.todos.find((t) => t.id === locationState.todoId);
      if (todo && list) {
        setSelectedTask({ todo, list });
        setIsEditing(true);
        lastHandledKey.current = location.key;
      }
    } else {
      const todo = inboxTodos.find((t) => t.id === locationState.todoId);
      if (todo) {
        setSelectedTask({ todo, list: null });
        setIsEditing(true);
        lastHandledKey.current = location.key;
      }
    }
  }, [locationState, location.key, todoLists, inboxTodos]);

  // Open the create-list form when navigated from another page requesting it
  const createListStateHandled = useRef(false);
  useEffect(() => {
    if (createListStateHandled.current || !locationState?.openCreateList) {
      return;
    }
    setShowCreateForm(true);
    createListStateHandled.current = true;
  }, [locationState]);

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

  function resolveList(listId: string | null): TodoList | null {
    if (!listId) return null;
    return todoLists?.find((l) => l.id === listId) ?? null;
  }

  function handleDeleteSelectedTodo(id: string) {
    handleDeleteTodo(id);
    setSelectedTask(null);
    setIsEditing(false);
  }

  function handleDeleteTodoFromList(id: string) {
    if (selectedTask?.todo.id === id) {
      handleDeleteSelectedTodo(id);
    } else {
      handleDeleteTodo(id);
    }
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

  if (isLoading) {
    return <TasksPageSkeleton />;
  }

  return (
    <div className="-m-6 grid min-h-full grid-cols-1 gap-6 pt-6 md:grid-cols-[1.08fr_0.92fr] lg:grid-cols-[1.2fr_0.8fr]">
      {/* Left panel: list — hidden on mobile once a task is selected, since
          the detail/edit view replaces it as its own screen there. */}
      <div
        className={mergeClassNames(
          'flex-col px-6 pb-6 md:pr-0 md:flex',
          selectedTask ? 'hidden' : 'flex'
        )}
      >
        <div className="pb-4">
          <div className="flex items-center justify-between mb-1 gap-2">
            <div
              role="group"
              aria-label={t('tasks.viewMode')}
              className="flex items-center border border-default rounded-inner overflow-hidden"
            >
              <button
                onClick={() => setViewMode('grouped')}
                aria-pressed={viewMode === 'grouped'}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === 'grouped'
                    ? 'bg-accent text-on-accent'
                    : 'bg-surface text-muted hover:text-primary'
                }`}
              >
                <Rows3 className="w-3.5 h-3.5" />
                {t('tasks.groupedView')}
              </button>
              <button
                onClick={() => setViewMode('flat')}
                aria-pressed={viewMode === 'flat'}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border-l border-default transition-colors ${
                  viewMode === 'flat'
                    ? 'bg-accent text-on-accent'
                    : 'bg-surface text-muted hover:text-primary'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                {t('tasks.flatView')}
              </button>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowCreateForm((v) => !v)}
            >
              <Plus className="w-4 h-4" />
              {t('tasks.newList')}
            </Button>
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

        <div className="flex-1 space-y-4">
          {viewMode === 'grouped' ? (
            <>
              <InboxSection
                todos={inboxTodos}
                onAddTodo={handleAddInboxTodo}
                selectedTodoId={selectedTask?.todo.id ?? null}
                onSelectTodo={(todo) => handleSelectTodo(todo, null)}
                onDeleteTodo={(todo) => handleDeleteTodoFromList(todo.id)}
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
                handleEditList={handleEditList}
                handleAddTodo={handleAddTodo}
                selectedTodoId={selectedTask?.todo.id ?? null}
                onSelectTodo={handleSelectTodo}
                onDeleteTodo={(todo) => handleDeleteTodoFromList(todo.id)}
                availableLists={availableLists}
                onReorderTodo={handleReorderTodo}
                onMoveTodo={handleMoveTodo}
                onCreateList={() => setShowCreateForm(true)}
              />
            </>
          ) : (
            <FlatTaskList
              entries={flatEntries}
              selectedTodoId={selectedTask?.todo.id ?? null}
              onSelectTodo={(todo, listId) =>
                handleSelectTodo(todo, resolveList(listId))
              }
              onDeleteTodo={(todo) => handleDeleteTodoFromList(todo.id)}
              availableLists={availableLists}
              onMoveTodo={handleMoveTodo}
            />
          )}
        </div>
      </div>

      <div
        className={mergeClassNames(
          'flex-col md:flex',
          selectedTask ? 'flex' : 'hidden'
        )}
      >
        <div className="flex flex-col rounded-card border border-default bg-surface shadow-card overflow-hidden md:sticky md:top-0">
          {selectedTask && (
            <div className="border-b border-default p-3 md:hidden">
              <IconButton
                ariaLabel={t('tasks.backToList')}
                onClick={() => {
                  setSelectedTask(null);
                  setIsEditing(false);
                }}
              >
                <ArrowLeft className="size-4" />
              </IconButton>
            </div>
          )}
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
            <SelectTaskPlaceholder />
          )}
        </div>
      </div>
    </div>
  );
}

export default TasksPage;
