import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from './DashboardPage';
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

jest.mock('../../fetchers/api', () => ({
  useTodoListsQuery: () => ({ data: mockTodoLists }),
  useInboxTodosQuery: () => ({ data: mockInboxTodos }),
  useAddInboxTodoMutation: () => ({ mutate: jest.fn() }),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-19T09:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
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
});
