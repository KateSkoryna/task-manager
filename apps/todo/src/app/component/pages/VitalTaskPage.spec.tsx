import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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
    },
    {
      id: 't2',
      name: 'Buy bread',
      status: 'successful',
      todolistId: 'l1',
      order: 1,
    },
  ],
};

const useTodoListsData = jest.fn();

jest.mock('../../hooks/useTodoListsData', () => ({
  useTodoListsData: () => useTodoListsData(),
}));

describe('VitalTaskPage', () => {
  beforeEach(() => {
    useTodoListsData.mockReturnValue({
      todoLists: [vitalList],
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      handleDeleteList: jest.fn(),
      handleAddTodo: jest.fn(),
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
});
