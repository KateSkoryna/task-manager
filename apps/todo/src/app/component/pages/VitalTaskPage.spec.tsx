import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import {
  initialListViewState,
  useListViewStore,
} from '../../store/listViewStore';
import VitalTaskPage from './VitalTaskPage';
import type { TodoList } from '@shared/types';

jest.mock('../../lib/imageUtils', () => ({ uploadImage: jest.fn() }));
jest.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (s: { user: { firebaseUid: string } }) => unknown) =>
    selector({ user: { firebaseUid: 'u1' } }),
}));

const vitalList: TodoList = {
  id: 'l1',
  name: 'Groceries',
  userId: 'u1',
  priority: 'high',
  todos: [
    {
      id: 't1',
      name: 'Buy milk',
      status: 'pending',
      todolistId: 'l1',
      order: 0,
      priority: 'medium',
      source: 'web',
    },
    {
      id: 't2',
      name: 'Buy bread',
      status: 'successful',
      todolistId: 'l1',
      order: 1,
      priority: 'medium',
      source: 'web',
    },
  ],
};

const useTodoListsData = jest.fn();
const mockHandleAddInboxTodo = jest.fn();
const mockHandleArchiveTodo = jest.fn();

jest.mock('../../hooks/useTodoListsData', () => ({
  useTodoListsData: () => useTodoListsData(),
}));

describe('VitalTaskPage', () => {
  beforeEach(() => {
    useListViewStore.setState(initialListViewState);
    useTodoListsData.mockReturnValue({
      todoLists: [vitalList],
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      handleDeleteList: jest.fn(),
      handleAddTodo: jest.fn(),
      handleAddInboxTodo: mockHandleAddInboxTodo,
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

  test('hides completed tasks from the high-priority list section', () => {
    render(
      <MemoryRouter>
        <VitalTaskPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
    expect(screen.queryByText('Buy bread')).not.toBeInTheDocument();
  });

  test('adds a task to the inbox from the header add-task form', async () => {
    render(
      <MemoryRouter>
        <VitalTaskPage />
      </MemoryRouter>
    );
    expect(screen.queryByTestId('todo-form-input')).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId('add-task-button'));
    await userEvent.type(screen.getByTestId('todo-form-input'), 'Water plants');
    await userEvent.click(screen.getByTestId('todo-form-submit-button'));

    expect(mockHandleAddInboxTodo).toHaveBeenCalledWith(
      'Water plants',
      undefined
    );
    expect(screen.queryByTestId('todo-form-input')).not.toBeInTheDocument();
  });

  test('opens the add-task form when another page asks for it', () => {
    render(
      <MemoryRouter
        initialEntries={[{ pathname: '/vital', state: { openAddTask: true } }]}
      >
        <VitalTaskPage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('todo-form-input')).toBeInTheDocument();
  });

  test('has a sort menu and a collapse-all button for the lists', async () => {
    render(
      <MemoryRouter>
        <VitalTaskPage />
      </MemoryRouter>
    );
    expect(screen.getByLabelText('tasks.sortBy')).toBeInTheDocument();
    expect(screen.getByTestId('todo-item-t1')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('toggle-all-lists'));
    expect(screen.queryByTestId('todo-item-t1')).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId('toggle-all-lists'));
    expect(screen.getByTestId('todo-item-t1')).toBeInTheDocument();
  });

  test('keeps lists collapsed when the page is shown again', async () => {
    const first = render(
      <MemoryRouter>
        <VitalTaskPage />
      </MemoryRouter>
    );
    await userEvent.click(screen.getByTestId('toggle-all-lists'));
    expect(screen.queryByTestId('todo-item-t1')).not.toBeInTheDocument();
    first.unmount();

    render(
      <MemoryRouter>
        <VitalTaskPage />
      </MemoryRouter>
    );
    expect(screen.queryByTestId('todo-item-t1')).not.toBeInTheDocument();
  });

  test('archives the selected task and clears the selection', async () => {
    render(
      <MemoryRouter>
        <VitalTaskPage />
      </MemoryRouter>
    );
    await userEvent.click(screen.getByTestId('todo-item-t1'));
    await userEvent.click(screen.getByTestId('archive-todo-button-t1'));

    expect(mockHandleArchiveTodo).toHaveBeenCalledWith('t1');
    expect(screen.queryByTestId('pomodoro-timer')).not.toBeInTheDocument();
  });
});
