import { useMemo } from 'react';
import {
  useCreateListMutation,
  useEditListMutation,
  useDeleteListMutation,
  useAddTodoMutation,
  useToggleTodoMutation,
  useDeleteTodoMutation,
  useEditTodoMutation,
  useTodoListsQuery,
  useInboxTodosQuery,
  useAddInboxTodoMutation,
} from '../fetchers/api';
import {
  UpdateTodoItem,
  UpdateTodoList,
  TodoListPriority,
  TodoListCategory,
} from '@shared/types';
import { CreateTodoListOpts } from '../fetchers/todolist';
import { toggledCompletion } from '../lib/todayTasks';
import { archiveUpdate, isArchived, restoreUpdate } from '../lib/archive';
import { FlatEntry } from '../component/todo/FlatTaskList';

export const useTodoListsData = () => {
  const {
    data: todoLists,
    isLoading,
    isError,
    error,
    refetch,
  } = useTodoListsQuery();
  const { data: inboxTodos = [] } = useInboxTodosQuery();

  // Archived tasks are hidden from `todoLists`/`inboxTodos`; the Archived view
  // reads them from the same cache, unfiltered.
  const { data: allLists = [] } = useTodoListsQuery({ includeArchived: true });
  const { data: allInbox = [] } = useInboxTodosQuery({ includeArchived: true });
  const archivedEntries = useMemo<FlatEntry[]>(
    () =>
      [
        ...allLists.flatMap((list) =>
          list.todos.map((todo) => ({ todo, listId: list.id }))
        ),
        ...allInbox.map((todo) => ({ todo, listId: null })),
      ]
        .filter(({ todo }) => isArchived(todo))
        .sort((a, b) =>
          (b.todo.archivedAt ?? '').localeCompare(a.todo.archivedAt ?? '')
        ),
    [allLists, allInbox]
  );

  const createListMutation = useCreateListMutation();
  const editListMutation = useEditListMutation();
  const deleteListMutation = useDeleteListMutation();
  const addTodoMutation = useAddTodoMutation();
  const addInboxTodoMutation = useAddInboxTodoMutation();
  const toggleTodoMutation = useToggleTodoMutation();
  const deleteTodoMutation = useDeleteTodoMutation();
  const editTodoMutation = useEditTodoMutation();

  const findTodo = (id: string) =>
    allLists
      .flatMap((list) => list.todos)
      .concat(allInbox)
      .find((t) => t.id === id);

  const handleCreateList = (
    name: string,
    opts?: {
      priority?: TodoListPriority;
      category?: TodoListCategory;
      dueDate?: string | null;
      notes?: string | null;
    }
  ) => {
    createListMutation.mutate({ name, ...opts });
  };

  // Resolves with the new list, for callers that use it straight away.
  const createList = (name: string, opts?: CreateTodoListOpts) =>
    createListMutation.mutateAsync({ name, ...opts });

  const handleDeleteList = (id: string) => {
    deleteListMutation.mutate(id);
  };

  const handleAddTodo = (
    todolistId: string,
    name: string,
    opts?: {
      dueDate?: string;
      location?: string;
      notes?: string;
      image?: string | null;
    }
  ) => {
    addTodoMutation.mutate({ todolistId, name, ...opts });
  };

  const handleAddInboxTodo = (
    name: string,
    opts?: {
      dueDate?: string;
      location?: string;
      notes?: string;
      image?: string | null;
    }
  ) => {
    addInboxTodoMutation.mutate({ name, ...opts });
  };

  const handleToggleTodo = (id: string) => {
    const todo = findTodo(id);
    if (todo) {
      toggleTodoMutation.mutate({ id, ...toggledCompletion(todo) });
    }
  };

  const handleDeleteTodo = (id: string) => {
    const image = findTodo(id)?.image;
    deleteTodoMutation.mutate({ id, image });
  };

  const handleEditList = (todolistId: string, updates: UpdateTodoList) => {
    editListMutation.mutate({ todolistId, ...updates });
  };

  const handleEditTodo = (
    id: string,
    updates: UpdateTodoItem,
    onError?: () => void
  ) => {
    const oldImage = findTodo(id)?.image;
    editTodoMutation.mutate(
      { id, oldImage, ...updates },
      {
        onError: (err) => {
          console.error(`Failed to save edits for todo ${id}:`, err);
          onError?.();
        },
      }
    );
  };

  const handleArchiveTodo = (id: string) => {
    editTodoMutation.mutate({ id, ...archiveUpdate() });
  };

  const handleRestoreTodo = (id: string) => {
    editTodoMutation.mutate({ id, ...restoreUpdate() });
  };

  return {
    todoLists,
    inboxTodos,
    archivedEntries,
    isLoading,
    isError,
    error,
    refetch,
    handleCreateList,
    createList,
    handleDeleteList,
    handleEditList,
    handleAddTodo,
    handleAddInboxTodo,
    handleToggleTodo,
    handleDeleteTodo,
    handleEditTodo,
    handleArchiveTodo,
    handleRestoreTodo,
    createListMutationIsPending: createListMutation.isPending,
  };
};
