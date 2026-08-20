import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import dayjs from 'dayjs';
import DashboardPage from './DashboardPage';
import { useDateStore } from '../../store/dateStore';
import type { TodoList, TodoItem } from '@shared/types';

const mockTodoLists: TodoList[] = [
  {
    id: 'l1',
    name: 'Groceries',
    userId: 'u1',
    todos: [
      {
        id: 't1',
        name: 'Go to Kik',
        status: 'pending',
        todolistId: 'l1',
        order: 0,
        dueDate: '2026-08-19',
      },
    ],
  },
];

const mockInboxTodos: TodoItem[] = [
  {
    id: 't2',
    name: 'buy shoes',
    status: 'pending',
    todolistId: null,
    order: 0,
    dueDate: '2026-08-19',
  },
];

const useTodoListsQuery = jest.fn();
const useInboxTodosQuery = jest.fn();
const refetchTodoLists = jest.fn();
const refetchInbox = jest.fn();

jest.mock('../../fetchers/api', () => ({
  useTodoListsQuery: () => useTodoListsQuery(),
  useInboxTodosQuery: () => useInboxTodosQuery(),
  useAddInboxTodoMutation: () => ({ mutate: jest.fn() }),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-19T09:00:00'));
    // dateStore's default selectedDate is set once at module-load time using
    // the real clock, before fake timers exist — pin it explicitly so this
    // test doesn't drift as the real calendar date moves on.
    useDateStore.setState({ selectedDate: dayjs() });
    useTodoListsQuery.mockReturnValue({
      data: mockTodoLists,
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchTodoLists,
    });
    useInboxTodosQuery.mockReturnValue({
      data: mockInboxTodos,
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchInbox,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('shows tasks due today from both lists and the inbox', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Go to Kik')).toBeInTheDocument();
    expect(screen.getByText('buy shoes')).toBeInTheDocument();
  });

  test('shows a skeleton placeholder while todo lists or inbox are loading', () => {
    useTodoListsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: refetchTodoLists,
    });
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    expect(screen.queryByText('Go to Kik')).not.toBeInTheDocument();
    expect(
      screen.getByRole('status', { name: 'Loading dashboard' })
    ).toBeInTheDocument();
  });

  test('shows a retryable error when loading fails', () => {
    useInboxTodosQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('network down'),
      refetch: refetchInbox,
    });
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    expect(screen.getByText('network down')).toBeInTheDocument();
    screen.getByText('Try again').click();
    expect(refetchTodoLists).toHaveBeenCalled();
    expect(refetchInbox).toHaveBeenCalled();
  });
});
