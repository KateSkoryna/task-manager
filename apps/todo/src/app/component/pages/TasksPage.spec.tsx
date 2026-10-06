import { MemoryRouter, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TodoItem } from '@shared/types';
import {
  initialListViewState,
  useListViewStore,
} from '../../store/listViewStore';
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

function renderTasksPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/tasks']}>
        <TasksPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('TasksPage', () => {
  beforeEach(() => useListViewStore.setState(initialListViewState));
  it('has no add-task control; tasks are added from Vital Tasks and each list', () => {
    renderTasksPage();
    expect(screen.queryByTestId('add-task-button')).not.toBeInTheDocument();
    expect(
      within(screen.getByTestId('inbox-section')).queryByRole('button', {
        name: /add task/i,
      })
    ).not.toBeInTheDocument();
  });

  it('offers task sorts in the flat view and list sorts in the grouped view', async () => {
    renderTasksPage();

    await userEvent.click(screen.getByLabelText('tasks.sortBy'));
    expect(
      await screen.findByRole('button', { name: 'tasks.sortListDueDate' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'tasks.sortStatus' })
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'tasks.flatView' })
    );
    await userEvent.click(screen.getByLabelText('tasks.sortBy'));
    expect(
      await screen.findByRole('button', { name: 'tasks.sortStatus' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'tasks.sortListDueDate' })
    ).not.toBeInTheDocument();
  });

  it('shows the collapse-all button in the grouped view only', async () => {
    renderTasksPage();
    expect(screen.getByTestId('toggle-all-lists')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'tasks.flatView' })
    );
    expect(screen.queryByTestId('toggle-all-lists')).not.toBeInTheDocument();
  });

  it('remembers the chosen view when the page is shown again', async () => {
    const { unmount } = renderTasksPage();
    await userEvent.click(
      screen.getByRole('button', { name: 'tasks.flatView' })
    );
    unmount();

    renderTasksPage();
    expect(screen.getByTestId('flat-task-list')).toBeInTheDocument();
  });

  it('re-sorts the flat view when a sort is chosen', async () => {
    renderTasksPage();
    await userEvent.click(
      screen.getByRole('button', { name: 'tasks.flatView' })
    );

    const order = () =>
      within(screen.getByTestId('flat-task-list'))
        .getAllByTestId(/^todo-item-/)
        .map((el) => el.getAttribute('data-testid'));
    // Default: due date, ties broken by name.
    expect(order()).toEqual(['todo-item-t1', 'todo-item-t2']);

    await userEvent.click(screen.getByLabelText('tasks.sortBy'));
    await userEvent.click(
      await screen.findByRole('button', { name: 'tasks.sortPriority' })
    );
    expect(order()).toEqual(['todo-item-t2', 'todo-item-t1']);
  });

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
