import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import {
  initialListViewState,
  useListViewStore,
} from '../../store/listViewStore';
import VitalTaskPage from './VitalTaskPage';
import type { TodoItem, TodoList } from '@shared/types';

jest.mock('../../lib/firebase', () => ({ auth: {} }));
jest.mock('firebase/auth', () => ({
  signOut: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../hooks/usePreferences', () => ({
  usePreferences: () => ({ preferences: { timezone: 'Europe/Berlin' } }),
}));
jest.mock('../../lib/imageUtils', () => ({ uploadImage: jest.fn() }));
jest.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (s: { user: { firebaseUid: string } }) => unknown) =>
    selector({ user: { firebaseUid: 'u1' } }),
}));

const today = new Date().toISOString();
const nextYear = new Date(new Date().getFullYear() + 1, 5, 15).toISOString();

const task = (over: Partial<TodoItem>): TodoItem => ({
  id: 'x',
  name: 'x',
  status: 'pending',
  todolistId: 'l1',
  order: 0,
  priority: 'high',
  source: 'web',
  dueDate: today,
  ...over,
});

// The list itself is not high priority: only the tasks' priority counts.
const list: TodoList = {
  id: 'l1',
  name: 'Groceries',
  userId: 'u1',
  priority: 'low',
  todos: [
    task({ id: 't1', name: 'Buy milk' }),
    task({ id: 't2', name: 'Buy bread', status: 'successful' }),
    task({ id: 't3', name: 'Buy eggs', priority: 'medium' }),
    task({ id: 't4', name: 'Buy tea', dueDate: undefined }),
    task({ id: 't5', name: 'Buy rice', dueDate: nextYear }),
  ],
};

const inboxTodo = task({ id: 't6', name: 'Call mom', todolistId: null });

const useTodoListsData = jest.fn();
const mockHandleArchiveTodo = jest.fn();

jest.mock('../../hooks/useTodoListsData', () => ({
  useTodoListsData: () => useTodoListsData(),
}));

describe('VitalTaskPage', () => {
  beforeEach(() => {
    useListViewStore.setState(initialListViewState);
    useTodoListsData.mockReturnValue({
      todoLists: [list],
      inboxTodos: [inboxTodo],
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      handleDeleteList: jest.fn(),
      handleAddTodo: jest.fn(),
      handleArchiveTodo: mockHandleArchiveTodo,
      handleDeleteTodo: jest.fn(),
      handleToggleTodo: jest.fn(),
    });
  });

  test('shows the pomodoro timer for a pending selected task', () => {
    render(
      <MemoryRouter>
        <VitalTaskPage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByTestId('todo-item-t1'));
    expect(screen.getByTestId('pomodoro-timer')).toBeInTheDocument();
  });

  test('lists every high-priority pending task due in the period, in lists and inbox', () => {
    render(
      <MemoryRouter>
        <VitalTaskPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
    expect(screen.getByText('Call mom')).toBeInTheDocument();
    expect(screen.queryByText('Buy bread')).not.toBeInTheDocument();
    expect(screen.queryByText('Buy eggs')).not.toBeInTheDocument();
    expect(screen.queryByText('Buy tea')).not.toBeInTheDocument();
    expect(screen.queryByText('Buy rice')).not.toBeInTheDocument();
  });

  test('switches the period to year and steps to the next one', async () => {
    render(
      <MemoryRouter>
        <VitalTaskPage />
      </MemoryRouter>
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'statistics.year' })
    );
    expect(screen.queryByText('Buy rice')).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'statistics.nextPeriod' })
    );
    expect(screen.getByText('Buy rice')).toBeInTheDocument();
    expect(screen.queryByText('Buy milk')).not.toBeInTheDocument();
  });

  test('has no add-task control; tasks are added from the Tasks page', () => {
    render(
      <MemoryRouter>
        <VitalTaskPage />
      </MemoryRouter>
    );
    expect(screen.queryByTestId('add-task-button')).not.toBeInTheDocument();
  });

  test('shows a flat list with a sort button', () => {
    render(
      <MemoryRouter>
        <VitalTaskPage />
      </MemoryRouter>
    );
    expect(screen.getByLabelText('tasks.sortBy')).toBeInTheDocument();
    expect(screen.getByTestId('flat-task-list')).toBeInTheDocument();
  });

  test('archives the selected task and clears the selection', async () => {
    render(
      <MemoryRouter>
        <VitalTaskPage />
      </MemoryRouter>
    );
    await userEvent.click(screen.getByTestId('todo-item-t1'));
    await userEvent.click(screen.getByTestId('task-actions-t1'));
    await userEvent.click(screen.getByTestId('archive-todo-button-t1'));

    expect(mockHandleArchiveTodo).toHaveBeenCalledWith('t1');
    expect(screen.queryByTestId('pomodoro-timer')).not.toBeInTheDocument();
  });

  test('shows the empty message in both columns when there are no tasks', () => {
    useTodoListsData.mockReturnValue({
      todoLists: [{ ...list, todos: [] }],
      inboxTodos: [],
      isLoading: false,
      handleArchiveTodo: mockHandleArchiveTodo,
      handleDeleteTodo: jest.fn(),
      handleToggleTodo: jest.fn(),
    });
    render(
      <MemoryRouter>
        <VitalTaskPage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('empty-vital-tasks')).toHaveTextContent(
      'tasks.emptyVitalView'
    );
    expect(screen.queryByText('tasks.selectTask')).toBeNull();
    expect(screen.getAllByText('tasks.emptyVitalView')).toHaveLength(2);
  });
});
