import {
  MAX_PAGE_SIZE,
  TodoList as TodoListType,
  TodoItem as TodoItemType,
  TodoListPriority,
  TodoListCategory,
} from '@shared/types';
import apiClient from '../lib/apiClient';

export type CreateTodoListOpts = {
  priority?: TodoListPriority;
  category?: TodoListCategory;
  dueDate?: string | null;
  notes?: string | null;
};

export const getTodoListsFetcher = async (
  userId: string
): Promise<TodoListType[]> => {
  const { data } = await apiClient.get<{ items: TodoListType[] }>(
    `/users/${userId}/todolists`,
    { params: { limit: MAX_PAGE_SIZE } }
  );
  return data.items;
};

export const createTodoListFetcher = async (
  name: string,
  userId: string,
  opts?: CreateTodoListOpts
): Promise<TodoListType> => {
  const { data } = await apiClient.post(`/users/${userId}/todolists`, {
    name,
    ...opts,
  });
  return data;
};

export const updateTodoListFetcher = async (
  todolistId: string,
  userId: string,
  updates: {
    name?: string;
    priority?: TodoListPriority;
    category?: TodoListCategory;
    dueDate?: string | null;
    notes?: string | null;
  }
): Promise<TodoListType> => {
  const { data } = await apiClient.put(
    `/users/${userId}/todolists/${todolistId}`,
    updates
  );
  return data;
};

export const deleteTodoListFetcher = async (
  todolistId: string,
  userId: string
): Promise<void> => {
  await apiClient.delete(`/users/${userId}/todolists/${todolistId}`);
};

export const createTodoFetcher = async (
  todolistId: string,
  userId: string,
  name: string,
  opts?: {
    dueDate?: string;
    location?: string;
    notes?: string;
    image?: string | null;
  }
): Promise<TodoItemType> => {
  const { data } = await apiClient.post(
    `/users/${userId}/todolists/${todolistId}/todos`,
    { name, ...opts }
  );
  return data;
};

export const updateTodoFetcher = async (
  id: string,
  todolistId: string,
  userId: string,
  updates: {
    name?: string;
    status?: string;
    completedAt?: string | null;
    dueDate?: string | null;
    location?: string | null;
    notes?: string | null;
    image?: string | null;
  }
): Promise<TodoItemType> => {
  const { data } = await apiClient.put(
    `/users/${userId}/todolists/${todolistId}/todos/${id}`,
    updates
  );
  return data;
};

export const deleteTodoFetcher = async (
  id: string,
  todolistId: string,
  userId: string
): Promise<void> => {
  await apiClient.delete(
    `/users/${userId}/todolists/${todolistId}/todos/${id}`
  );
};
