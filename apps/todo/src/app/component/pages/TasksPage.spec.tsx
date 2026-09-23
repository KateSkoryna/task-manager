import { MemoryRouter, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TodoItem } from '@shared/types';
import TasksPage from './TasksPage';

jest.mock('../../lib/firebase', () => ({ auth: {} }));
jest.mock('firebase/auth', () => ({
  signOut: jest.fn().mockResolvedValue(undefined),
}));

const TODO_ONE: TodoItem = {
  id: 't1',
  name: 'Task One',
  status: 'pending',
  todolistId: null,
  order: 0,
  priority: 'medium',
  source: 'web',
};

const TODO_TWO: TodoItem = {
  id: 't2',
  name: 'Task Two',
  status: 'pending',
  todolistId: null,
  order: 1,
  priority: 'high',
  source: 'web',
};

jest.mock('../../hooks/useTodoListsData', () => ({
  useTodoListsData: () => ({
    todoLists: [],
    inboxTodos: [TODO_ONE, TODO_TWO],
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
    handleCreateList: jest.fn(),
    handleDeleteList: jest.fn(),
    handleEditList: jest.fn(),
    handleAddTodo: jest.fn(),
    handleAddInboxTodo: jest.fn(),
    handleDeleteTodo: jest.fn(),
    handleEditTodo: jest.fn(),
    createListMutationIsPending: false,
  }),
}));

/** Fires a `navigate('/tasks', { state })` on demand, the same way a chat
 * task link (or the header search) selects and opens a different task. */
function NavigationTrigger() {
  const navigate = useNavigate();
  return (
    <>
      <button onClick={() => navigate('/tasks', { state: { todoId: 't1' } })}>
        select-task-one
      </button>
      <button onClick={() => navigate('/tasks', { state: { todoId: 't2' } })}>
        select-task-two
      </button>
    </>
  );
}

describe('TasksPage', () => {
  it('scrolls the selected task back into view in the left list', async () => {
    // test-setup.ts stubs this globally (jsdom has no real layout/scrolling
    // to call it for real); spy on that stub to assert the effect fires.
    const scrollIntoView = jest
      .spyOn(Element.prototype, 'scrollIntoView')
      .mockImplementation(() => undefined);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/tasks']}>
          <TasksPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await userEvent.click(screen.getByTestId('todo-item-t2'));

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'nearest',
    });

    scrollIntoView.mockRestore();
  });

  it("resets the edit form to the newly selected task instead of keeping the previous one's stale values", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/tasks']}>
          <NavigationTrigger />
          <TasksPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await userEvent.click(screen.getByText('select-task-one'));
    expect(screen.getByTestId('edit-todo-input-t1')).toHaveValue('Task One');

    await userEvent.click(screen.getByText('select-task-two'));
    expect(screen.getByTestId('edit-todo-input-t2')).toHaveValue('Task Two');
    expect(screen.queryByTestId('edit-todo-input-t1')).not.toBeInTheDocument();
  });
});
