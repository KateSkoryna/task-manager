import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ref, deleteObject } from 'firebase/storage';
import {
  createTodoListFetcher,
  updateTodoListFetcher,
  deleteTodoListFetcher,
  createTodoFetcher,
  updateTodoFetcher,
  deleteTodoFetcher,
  getTodoListsFetcher,
  CreateTodoListOpts,
} from './todolist';
import {
  TodoList as TodoListType,
  TodoItem as TodoItemType,
  UpdateTodoItem,
  UpdateTodoList,
} from '@shared/types';
import { useAuthStore } from '../store/authStore';
import { storage } from '../lib/firebase';

export const useTodoListsQuery = () => {
  const user = useAuthStore((s) => s.user);
  return useQuery<TodoListType[], Error>({
    queryKey: ['todoLists', user?.id],
    queryFn: () => getTodoListsFetcher(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
};

export const useCreateListMutation = () => {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  return useMutation<
    TodoListType,
    Error,
    { name: string } & CreateTodoListOpts
  >({
    mutationFn: ({ name, ...opts }) =>
      createTodoListFetcher(name, user!.id, opts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todoLists', user?.id] });
    },
    onError: (err) => console.error('Error creating todolist:', err),
  });
};

export const useEditListMutation = () => {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  return useMutation<
    TodoListType,
    Error,
    { todolistId: string } & UpdateTodoList
  >({
    mutationFn: ({ todolistId, ...updates }) =>
      updateTodoListFetcher(todolistId, user!.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todoLists', user?.id] });
    },
    onError: (err) => console.error('Error editing todolist:', err),
  });
};

export const useDeleteListMutation = () => {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (todolistId) => deleteTodoListFetcher(todolistId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todoLists', user?.id] });
    },
    onError: (err) => console.error('Error deleting todolist:', err),
  });
};

export const useAddTodoMutation = () => {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  return useMutation<
    TodoItemType,
    Error,
    {
      todolistId: string;
      name: string;
      dueDate?: string;
      location?: string;
      notes?: string;
      image?: string | null;
    }
  >({
    mutationFn: ({ todolistId, name, dueDate, location, notes, image }) =>
      createTodoFetcher(todolistId, user!.id, name, {
        dueDate,
        location,
        notes,
        image,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todoLists', user?.id] });
    },
    onError: async (err, { image }) => {
      console.error('Error creating todo:', err);
      if (image) {
        try {
          await deleteObject(ref(storage, image));
        } catch (cleanupErr) {
          console.error(
            'Failed to delete orphaned image from storage:',
            cleanupErr
          );
        }
      }
    },
  });
};

export const useToggleTodoMutation = () => {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  return useMutation<
    TodoItemType,
    Error,
    {
      id: string;
      todolistId: string;
      status: string;
      completedAt: string | null;
    }
  >({
    mutationFn: ({ id, todolistId, status, completedAt }) =>
      updateTodoFetcher(id, todolistId, user!.id, { status, completedAt }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todoLists', user?.id] });
    },
    onError: (err) => console.error('Error updating todo:', err),
  });
};

export const useEditTodoMutation = () => {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  return useMutation<
    TodoItemType,
    Error,
    {
      id: string;
      todolistId: string;
      oldImage?: string | null;
    } & UpdateTodoItem
  >({
    mutationFn: ({ id, todolistId, oldImage: _, ...updates }) =>
      updateTodoFetcher(id, todolistId, user!.id, updates),
    onSuccess: async (_, { oldImage, image }) => {
      if (oldImage && image !== undefined && oldImage !== image) {
        try {
          await deleteObject(ref(storage, oldImage));
        } catch (err) {
          console.error('Failed to delete old image from storage:', err);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['todoLists', user?.id] });
    },
    onError: async (err, { oldImage, image }) => {
      console.error('Error editing todo:', err);
      if (image && image !== oldImage) {
        try {
          await deleteObject(ref(storage, image));
        } catch (cleanupErr) {
          console.error(
            'Failed to delete orphaned image from storage:',
            cleanupErr
          );
        }
      }
    },
  });
};

export const useDeleteTodoMutation = () => {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  return useMutation<
    void,
    Error,
    { id: string; todolistId: string; image?: string | null }
  >({
    mutationFn: ({ id, todolistId }) =>
      deleteTodoFetcher(id, todolistId, user!.id),
    onSuccess: async (_, { image }) => {
      if (image) {
        try {
          await deleteObject(ref(storage, image));
        } catch (err) {
          console.error('Failed to delete image from storage:', err);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['todoLists', user?.id] });
    },
    onError: (err) => console.error('Error deleting todo:', err),
  });
};
