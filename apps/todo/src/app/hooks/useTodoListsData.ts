import {
  useCreateListMutation,
  useEditListMutation,
  useDeleteListMutation,
  useAddTodoMutation,
  useToggleTodoMutation,
  useDeleteTodoMutation,
  useEditTodoMutation,
  useTodoListsQuery,
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

  const createListMutation = useCreateListMutation();
  const editListMutation = useEditListMutation();
  const deleteListMutation = useDeleteListMutation();
  const addTodoMutation = useAddTodoMutation();
  const toggleTodoMutation = useToggleTodoMutation();
  const deleteTodoMutation = useDeleteTodoMutation();
  const editTodoMutation = useEditTodoMutation();

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

  const handleToggleTodo = (id: string, todolistId: string) => {
    const todo = todoLists
      ?.flatMap((list) => list.todos)
      .find((t) => t.id === id);
    if (todo) {
      const status = todo.status === 'successful' ? 'pending' : 'successful';
      toggleTodoMutation.mutate({
        id,
        todolistId,
        status,
        completedAt: status === 'successful' ? new Date().toISOString() : null,
      });
    }
  };

  const handleDeleteTodo = (id: string, todolistId: string) => {
    const image = todoLists
      ?.flatMap((list) => list.todos)
      .find((t) => t.id === id)?.image;
    deleteTodoMutation.mutate({ id, todolistId, image });
  };

  const handleEditList = (todolistId: string, updates: UpdateTodoList) => {
    editListMutation.mutate({ todolistId, ...updates });
  };

  const handleEditTodo = (
    id: string,
    todolistId: string,
    updates: UpdateTodoItem,
    onError?: () => void
  ) => {
    const oldImage = todoLists
      ?.flatMap((list) => list.todos)
      .find((t) => t.id === id)?.image;
    editTodoMutation.mutate(
      { id, todolistId, oldImage, ...updates },
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
    isLoading,
    isError,
    error,
    refetch,
    handleCreateList,
    handleDeleteList,
    handleEditList,
    handleAddTodo,
    handleToggleTodo,
    handleDeleteTodo,
    handleEditTodo,
    createListMutationIsPending: createListMutation.isPending,
  };
};
