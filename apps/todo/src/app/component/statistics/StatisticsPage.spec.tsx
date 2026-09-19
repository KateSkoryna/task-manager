import { render, screen } from '@testing-library/react';
import type { TodoList, TodoItem } from '@shared/types';
import StatisticsPage from './StatisticsPage';

const mockTodoLists: TodoList[] = [
  {
    id: 'l1',
    name: 'Groceries',
    userId: 'u1',
    category: 'home',
    todos: [
      {
        id: 't1',
        name: 'Buy milk',
        status: 'successful',
        todolistId: 'l1',
        order: 0,
        priority: 'medium',
        source: 'web',
      },
    ],
  },
];

const mockInboxTodos: TodoItem[] = [
  {
    id: 't2',
    name: 'Inbox task',
    status: 'successful',
    todolistId: null,
    order: 0,
    priority: 'medium',
    source: 'web',
  },
  {
    id: 't3',
    name: 'Another inbox task',
    status: 'pending',
    todolistId: null,
    order: 1,
    priority: 'low',
    source: 'web',
  },
];

const useTodoListsQuery = jest.fn();
const useInboxTodosQuery = jest.fn();

jest.mock('../../fetchers/api', () => ({
  useTodoListsQuery: () => useTodoListsQuery(),
  useInboxTodosQuery: () => useInboxTodosQuery(),
}));

describe('StatisticsPage', () => {
  beforeEach(() => {
    useTodoListsQuery.mockReturnValue({
      data: mockTodoLists,
      isLoading: false,
    });
    useInboxTodosQuery.mockReturnValue({
      data: mockInboxTodos,
      isLoading: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('counts inbox todos in the KPI totals and the time series, not just list todos', () => {
    render(<StatisticsPage />);

    // 1 list todo + 2 inbox todos = 3 total tracked todos.
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('stays in the loading state until both list and inbox todos have resolved', () => {
    useInboxTodosQuery.mockReturnValue({ data: undefined, isLoading: true });

    render(<StatisticsPage />);

    expect(screen.getByText('statistics.loading')).toBeInTheDocument();
    expect(screen.queryByText('3')).not.toBeInTheDocument();
  });
});
