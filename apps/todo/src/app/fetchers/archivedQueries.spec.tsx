import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { TodoItem, TodoList } from '@shared/types';
import { useInboxTodosQuery, useTodoListsQuery } from './api';

jest.mock('../lib/firebase', () => ({ auth: {}, storage: {} }));
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  deleteObject: jest.fn(),
}));
jest.mock('../store/authStore', () => ({
  useAuthStore: (selector: (s: { user: { id: string } }) => unknown) =>
    selector({ user: { id: 'u1' } }),
}));

const ARCHIVED_AT = '2026-09-01T00:00:00.000Z';
const todo = (id: string, archivedAt?: string): TodoItem => ({
  id,
  name: id,
  status: 'successful',
  todolistId: null,
  order: 0,
  priority: 'medium',
  source: 'web',
  archivedAt,
});
const lists: TodoList[] = [
  {
    id: 'l1',
    name: 'Work',
    userId: 'u1',
    todos: [todo('active'), todo('archived', ARCHIVED_AT)],
  },
];
const inbox = [todo('inbox-active'), todo('inbox-archived', ARCHIVED_AT)];

jest.mock('./todolist', () => ({
  ...jest.requireActual('./todolist'),
  getTodoListsFetcher: jest.fn(async () => lists),
  getInboxTodosFetcher: jest.fn(async () => inbox),
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('list and inbox queries', () => {
  it('hide archived tasks by default', async () => {
    const listsResult = renderHook(() => useTodoListsQuery(), { wrapper });
    const inboxResult = renderHook(() => useInboxTodosQuery(), { wrapper });

    await waitFor(() => expect(listsResult.result.current.data).toBeDefined());
    await waitFor(() => expect(inboxResult.result.current.data).toBeDefined());

    expect(listsResult.result.current.data?.[0].todos.map((t) => t.id)).toEqual(
      ['active']
    );
    expect(inboxResult.result.current.data?.map((t) => t.id)).toEqual([
      'inbox-active',
    ]);
  });

  it('include archived tasks when asked, for statistics and the Archived view', async () => {
    const listsResult = renderHook(
      () => useTodoListsQuery({ includeArchived: true }),
      { wrapper }
    );
    const inboxResult = renderHook(
      () => useInboxTodosQuery({ includeArchived: true }),
      { wrapper }
    );

    await waitFor(() => expect(listsResult.result.current.data).toBeDefined());
    await waitFor(() => expect(inboxResult.result.current.data).toBeDefined());

    expect(listsResult.result.current.data?.[0].todos.map((t) => t.id)).toEqual(
      ['active', 'archived']
    );
    expect(inboxResult.result.current.data?.map((t) => t.id)).toEqual([
      'inbox-active',
      'inbox-archived',
    ]);
  });
});
