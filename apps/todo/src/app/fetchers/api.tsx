import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { ref, deleteObject } from 'firebase/storage';
import {
  createTodoListFetcher,
  updateTodoListFetcher,
  deleteTodoListFetcher,
  createTodoFetcher,
  updateTodoFetcher,
  deleteTodoFetcher,
  getTodoListsFetcher,
  getInboxTodosFetcher,
  createInboxTodoFetcher,
  CreateTodoListOpts,
} from './todolist';
import {
  TodoList as TodoListType,
  TodoItem as TodoItemType,
  ParsedTask,
  PaginatedResult,
  Report,
  ReportPeriod,
  UpdateTodoItem,
  UpdateTodoList,
} from '@shared/types';
import { useAuthStore } from '../store/authStore';
import { storage } from '../lib/firebase';
import { parseTodoFetcher } from './agent';
import {
  generateReportFetcher,
  generateReportNarrativeFetcher,
  getReportFetcher,
  getReportsFetcher,
} from './reports';

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

export const useInboxTodosQuery = () => {
  const user = useAuthStore((s) => s.user);
  return useQuery<TodoItemType[], Error>({
    queryKey: ['inboxTodos', user?.id],
    queryFn: () => getInboxTodosFetcher(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
};

export const useReportsQuery = (
  period: ReportPeriod,
  sort: 'asc' | 'desc' = 'desc'
) => {
  const user = useAuthStore((s) => s.user);
  return useInfiniteQuery<PaginatedResult<Report>, Error>({
    queryKey: ['reports', user?.id, period, sort],
    queryFn: ({ pageParam }) =>
      getReportsFetcher(user!.id, period, {
        cursor: pageParam as string | null,
        sort,
      }),
    enabled: !!user,
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
};

export const useReportQuery = (reportId: string | undefined) => {
  const user = useAuthStore((s) => s.user);
  return useQuery<Report, Error>({
    queryKey: ['report', user?.id, reportId],
    queryFn: () => getReportFetcher(user!.id, reportId!),
    enabled: !!user && !!reportId,
  });
};

export const useGenerateReportMutation = () => {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  return useMutation<
    Report,
    Error,
    { period: ReportPeriod; referenceDate?: string }
  >({
    mutationFn: ({ period, referenceDate }) =>
      generateReportFetcher(user!.id, period, referenceDate),
    onSuccess: (_, { period }) => {
      queryClient.invalidateQueries({
        queryKey: ['reports', user?.id, period],
      });
    },
  });
};

export const useGenerateReportNarrativeMutation = () => {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  return useMutation<Report, Error, { reportId: string }>({
    mutationFn: ({ reportId }) =>
      generateReportNarrativeFetcher(user!.id, reportId),
    onSuccess: (report) => {
      queryClient.setQueryData(['report', user?.id, report.id], report);
    },
    // A failed attempt (e.g. Gemini overloaded) still counts against the
    // report's generation cap server-side - refetch so the UI's remaining-
    // attempts count doesn't go stale after an error.
    onError: (_error, { reportId }) => {
      queryClient.invalidateQueries({
        queryKey: ['report', user?.id, reportId],
      });
    },
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

export const useAddInboxTodoMutation = () => {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  return useMutation<
    TodoItemType,
    Error,
    {
      name: string;
      dueDate?: string;
      location?: string;
      notes?: string;
      image?: string | null;
    }
  >({
    mutationFn: ({ name, dueDate, location, notes, image }) =>
      createInboxTodoFetcher(user!.id, name, {
        dueDate,
        location,
        notes,
        image,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inboxTodos', user?.id] });
    },
    onError: async (err, { image }) => {
      console.error('Error creating inbox todo:', err);
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

export const invalidateTodoCaches = (
  queryClient: ReturnType<typeof useQueryClient>,
  userId?: string
) => {
  queryClient.invalidateQueries({ queryKey: ['todoLists', userId] });
  queryClient.invalidateQueries({ queryKey: ['inboxTodos', userId] });
};

export const useToggleTodoMutation = () => {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  return useMutation<
    TodoItemType,
    Error,
    {
      id: string;
      status: string;
      completedAt: string | null;
    }
  >({
    mutationFn: ({ id, status, completedAt }) =>
      updateTodoFetcher(id, user!.id, { status, completedAt }),
    onSuccess: () => {
      invalidateTodoCaches(queryClient, user?.id);
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
      oldImage?: string | null;
    } & UpdateTodoItem
  >({
    mutationFn: ({ id, oldImage: _, ...updates }) =>
      updateTodoFetcher(id, user!.id, updates),
    onSuccess: async (_, { oldImage, image }) => {
      if (oldImage && image !== undefined && oldImage !== image) {
        try {
          await deleteObject(ref(storage, oldImage));
        } catch (err) {
          console.error('Failed to delete old image from storage:', err);
        }
      }
      invalidateTodoCaches(queryClient, user?.id);
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

/**
 * Fire-and-forget quick-capture parse: no cache invalidation on success, no
 * `console.error` on failure — the caller treats every failure mode (bad
 * JSON, timeout, consent off, rate limit) the same way, by leaving the raw
 * task name alone.
 */
export const useParseTodoMutation = () => {
  return useMutation<ParsedTask, Error, string>({
    mutationFn: (text) => parseTodoFetcher(text),
  });
};

export const useDeleteTodoMutation = () => {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; image?: string | null }>({
    mutationFn: ({ id }) => deleteTodoFetcher(id, user!.id),
    onSuccess: async (_, { image }) => {
      if (image) {
        try {
          await deleteObject(ref(storage, image));
        } catch (err) {
          console.error('Failed to delete image from storage:', err);
        }
      }
      invalidateTodoCaches(queryClient, user?.id);
    },
    onError: (err) => console.error('Error deleting todo:', err),
  });
};
