import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { TodoList, TodoItem } from '@shared/types';
import StatisticsPage from './StatisticsPage';
import { useNotificationStore } from '../../store/notificationStore';

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
        dueDate: '2026-03-24T00:00:00.000Z',
      },
    ],
  },
];

const mockInboxTodos: TodoItem[] = [
  {
    id: 't2',
    name: 'Inbox task',
    status: 'pending',
    todolistId: null,
    order: 0,
    priority: 'medium',
    source: 'web',
    dueDate: '2026-03-24T00:00:00.000Z',
  },
];

const useTodoListsQuery = jest.fn();
const useInboxTodosQuery = jest.fn();
const useGenerateReportMutation = jest.fn();

jest.mock('../../fetchers/api', () => ({
  useTodoListsQuery: () => useTodoListsQuery(),
  useInboxTodosQuery: () => useInboxTodosQuery(),
  useGenerateReportMutation: () => useGenerateReportMutation(),
}));

jest.mock('../../hooks/usePreferences', () => ({
  usePreferences: () => ({ preferences: { timezone: 'UTC' } }),
}));

describe('StatisticsPage', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-25T10:00:00.000Z'));
    useTodoListsQuery.mockReturnValue({
      data: mockTodoLists,
      isLoading: false,
    });
    useInboxTodosQuery.mockReturnValue({
      data: mockInboxTodos,
      isLoading: false,
    });
    useGenerateReportMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    useNotificationStore.setState({ notifications: [] });
  });

  it('counts inbox todos in the KPI totals, not just list todos', () => {
    render(<StatisticsPage />);

    // 1 completed list todo + 1 pending inbox todo = 2 planned, 1 completed.
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('stays in the loading state until both list and inbox todos have resolved', () => {
    useInboxTodosQuery.mockReturnValue({ data: undefined, isLoading: true });

    render(<StatisticsPage />);

    expect(screen.getByText('statistics.loading')).toBeInTheDocument();
    expect(screen.queryByText('statistics.week')).not.toBeInTheDocument();
  });

  it('renders a completion-rate KPI computed from planned and completed tasks', () => {
    useTodoListsQuery.mockReturnValue({
      data: [
        {
          id: 'l1',
          name: 'Work',
          userId: 'u1',
          category: 'work',
          todos: [
            {
              id: 't1',
              name: 'A',
              status: 'successful',
              todolistId: 'l1',
              order: 0,
              priority: 'medium',
              source: 'web',
              dueDate: '2026-03-24T00:00:00.000Z',
            },
            {
              id: 't2',
              name: 'B',
              status: 'pending',
              todolistId: 'l1',
              order: 1,
              priority: 'medium',
              source: 'web',
              dueDate: '2026-03-24T00:00:00.000Z',
            },
          ],
        },
      ],
      isLoading: false,
    });
    useInboxTodosQuery.mockReturnValue({ data: [], isLoading: false });

    render(<StatisticsPage />);

    // "Completed Tasks" KPI: 1 of the 2 planned tasks completed.
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('changes the displayed period range when navigating to the previous period', () => {
    useTodoListsQuery.mockReturnValue({ data: [], isLoading: false });
    useInboxTodosQuery.mockReturnValue({ data: [], isLoading: false });

    render(<StatisticsPage />);

    const before = screen.getByText(/2026/).textContent;
    fireEvent.click(screen.getByLabelText('statistics.previousPeriod'));
    const after = screen.getByText(/2026/).textContent;

    expect(after).not.toBe(before);
  });

  it('switches to a week-length range when the Week option is selected', () => {
    useTodoListsQuery.mockReturnValue({ data: [], isLoading: false });
    useInboxTodosQuery.mockReturnValue({ data: [], isLoading: false });

    render(<StatisticsPage />);

    fireEvent.click(screen.getByText('statistics.week'));

    expect(screen.getByText(/Mar 23.*Mar 29, 2026/)).toBeInTheDocument();
  });

  it('generates a report for the currently displayed period and queues a notification', () => {
    const mutate = jest.fn((_vars, { onSuccess }) =>
      onSuccess({ id: 'report-1', name: 'Monthly report — March 2026' })
    );
    useGenerateReportMutation.mockReturnValue({ mutate, isPending: false });

    render(
      <MemoryRouter>
        <StatisticsPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('reports.generate'));

    expect(mutate).toHaveBeenCalledWith(
      { period: 'monthly', referenceDate: expect.any(String) },
      expect.any(Object)
    );
    expect(useNotificationStore.getState().notifications[0]).toMatchObject({
      reportId: 'report-1',
      read: false,
    });
  });
});
