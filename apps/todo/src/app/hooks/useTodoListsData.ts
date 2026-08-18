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

export const useTodoListsData = () => {
  const {
    data: todoLists,
    isLoading,
    isError,
    error,
    refetch,
  } = useTodoListsQuery();
  const { data: inboxTodos = [] } = useInboxTodosQuery();

  const createListMutation = useCreateListMutation();
  const editListMutation = useEditListMutation();
  const deleteListMutation = useDeleteListMutation();
  const addTodoMutation = useAddTodoMutation();
  const addInboxTodoMutation = useAddInboxTodoMutation();
  const toggleTodoMutation = useToggleTodoMutation();
  const deleteTodoMutation = useDeleteTodoMutation();
  const editTodoMutation = useEditTodoMutation();

  const findTodo = (id: string) =>
    todoLists
      ?.flatMap((list) => list.todos)
      .concat(inboxTodos)
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
      const status = todo.status === 'successful' ? 'pending' : 'successful';
      toggleTodoMutation.mutate({
        id,
        status,
        completedAt: status === 'successful' ? new Date().toISOString() : null,
      });
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

  return {
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
    handleToggleTodo,
    handleDeleteTodo,
    handleEditTodo,
    createListMutationIsPending: createListMutation.isPending,
  };
};
