import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from './DashboardPage';
import type { TodoList, TodoItem } from '@shared/types';

const TODAY = '2026-08-19';

function todo(overrides: Partial<TodoItem> & { id: string }): TodoItem {
  return {
    name: overrides.id,
    status: 'pending',
    todolistId: 'l1',
    order: 0,
    dueDate: TODAY,
    priority: 'medium',
    source: 'web',
    ...overrides,
  };
}

function listWith(todos: TodoItem[]): TodoList[] {
  return [{ id: 'l1', name: 'Groceries', userId: 'u1', todos }];
}

const mockInboxTodos: TodoItem[] = [
  todo({ id: 't2', name: 'buy shoes', todolistId: null, dueDate: null }),
];

const useTodoListsQuery = jest.fn();
const useInboxTodosQuery = jest.fn();
const refetchTodoLists = jest.fn();
const refetchInbox = jest.fn();
const mockToggle = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../fetchers/api', () => ({
  useTodoListsQuery: () => useTodoListsQuery(),
  useInboxTodosQuery: () => useInboxTodosQuery(),
  useToggleTodoMutation: () => ({ mutate: mockToggle }),
}));

jest.mock('../../hooks/useHeaderTaskSearch', () => ({
  useHeaderTaskSearch: () => ({
    query: '',
    setQuery: jest.fn(),
    status: 'idle',
    matches: [],
    clear: jest.fn(),
  }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// recharts measures its container, which jsdom cannot lay out.
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  PieChart: () => null,
  Pie: () => null,
  Cell: () => null,
}));

function mockLists(todos: TodoItem[]) {
  useTodoListsQuery.mockReturnValue({
    data: listWith(todos),
    isLoading: false,
    isError: false,
    error: null,
    refetch: refetchTodoLists,
  });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(`${TODAY}T09:00:00`));
    mockLists([todo({ id: 't1', name: 'Go to Kik' })]);
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

  test('is titled Today and renders no input for adding a task', () => {
    renderPage();
    expect(screen.getByText('dashboard.todayTitle')).toBeInTheDocument();
    // The only text field on the page is the task search.
    expect(screen.getAllByRole('textbox')).toEqual([
      screen.getByTestId('dashboard-search'),
    ]);
  });

  test('shows the task search for screens where the header has none', () => {
    renderPage();
    expect(
      screen.getByTestId('dashboard-search').closest('.lg\\:hidden')
    ).not.toBeNull();
  });

  test('shows an overdue task under Overdue and not under Due today', () => {
    mockLists([
      todo({ id: 'late', name: 'Pay rent', dueDate: '2026-08-17' }),
      todo({ id: 't1', name: 'Go to Kik' }),
    ]);
    renderPage();
    const overdue = within(screen.getByTestId('today-overdue'));
    const dueToday = within(screen.getByTestId('today-due'));
    expect(overdue.getByText('Pay rent')).toBeInTheDocument();
    expect(overdue.getByText('dashboard.relativeDaysAgo')).toBeInTheDocument();
    expect(dueToday.queryByText('Pay rent')).not.toBeInTheDocument();
    expect(dueToday.getByText('Go to Kik')).toBeInTheDocument();
  });

  test('pages through a long overdue list with the arrow buttons', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockLists(
      [1, 2, 3, 4, 5].map((day) =>
        todo({ id: `late-${day}`, dueDate: `2026-08-0${day}` })
      )
    );
    renderPage();
    const overdue = within(screen.getByTestId('today-overdue'));
    expect(overdue.getAllByTestId(/^today-task-/)).toHaveLength(4);
    expect(overdue.queryByText('late-5')).not.toBeInTheDocument();

    await user.click(
      overdue.getByRole('button', { name: 'dashboard.nextTasks' })
    );
    expect(overdue.getAllByTestId(/^today-task-/)).toHaveLength(1);
    expect(overdue.getByText('late-5')).toBeInTheDocument();
    expect(
      overdue.getByRole('button', { name: 'dashboard.nextTasks' })
    ).toBeDisabled();
  });

  // jsdom has no layout, so the height measurement keeps the block's
  // ceiling of 12 rows per page.
  test('pages through tasks due today with the arrow buttons', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockLists(Array.from({ length: 13 }, (_, n) => todo({ id: `task-${n}` })));
    renderPage();
    const dueToday = within(screen.getByTestId('today-due'));
    expect(dueToday.getAllByTestId(/^today-task-/)).toHaveLength(12);

    await user.click(
      dueToday.getByRole('button', { name: 'dashboard.nextTasks' })
    );
    expect(dueToday.getAllByTestId(/^today-task-/)).toHaveLength(1);

    await user.click(
      dueToday.getByRole('button', { name: 'dashboard.previousTasks' })
    );
    expect(dueToday.getAllByTestId(/^today-task-/)).toHaveLength(12);
  });

  test('lists only high-priority tasks due today under Top Priority', () => {
    mockLists([
      todo({ id: 'urgent', name: 'File taxes', priority: 'high' }),
      todo({ id: 'normal', name: 'Buy bread', priority: 'medium' }),
      todo({
        id: 'later',
        name: 'Plan trip',
        priority: 'high',
        dueDate: '2026-08-25',
      }),
    ]);
    renderPage();
    const top = within(screen.getByTestId('today-top-priority'));
    expect(top.getByText('File taxes')).toBeInTheDocument();
    expect(top.queryByText('Buy bread')).not.toBeInTheDocument();
    expect(top.queryByText('Plan trip')).not.toBeInTheDocument();
  });

  test('hides the Overdue block when nothing is overdue', () => {
    renderPage();
    expect(screen.queryByTestId('today-overdue')).not.toBeInTheDocument();
  });

  test('orders tasks due today unfinished first, then by priority', () => {
    mockLists([
      todo({ id: 'low', priority: 'low' }),
      todo({ id: 'done', priority: 'high', status: 'successful' }),
      todo({ id: 'high', priority: 'high' }),
    ]);
    renderPage();
    const rows = within(screen.getByTestId('today-due')).getAllByTestId(
      /^today-task-/
    );
    expect(rows.map((row) => row.getAttribute('data-testid'))).toEqual([
      'today-task-high',
      'today-task-low',
      'today-task-done',
    ]);
  });

  test('counts the same tasks in the progress line and the progress bar', () => {
    mockLists([
      todo({ id: 'a', status: 'successful' }),
      todo({ id: 'b' }),
      todo({ id: 'late', dueDate: '2026-08-10' }),
    ]);
    renderPage();
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '1');
    expect(bar).toHaveAttribute('aria-valuemax', '2');
  });

  test('completes a task from its row', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderPage();
    await user.click(
      within(screen.getByTestId('today-task-t1')).getByRole('checkbox')
    );
    expect(mockToggle).toHaveBeenCalledWith({
      id: 't1',
      status: 'successful',
      completedAt: expect.any(String),
    });
  });

  test('reopens a completed task from its row', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockLists([todo({ id: 't1', status: 'successful' })]);
    renderPage();
    const checkbox = within(screen.getByTestId('today-task-t1')).getByRole(
      'checkbox'
    );
    expect(checkbox).toBeChecked();
    await user.click(checkbox);
    expect(mockToggle).toHaveBeenCalledWith({
      id: 't1',
      status: 'pending',
      completedAt: null,
    });
  });

  test.each([
    ['overdue', [todo({ id: 'late', dueDate: '2026-08-10' })]],
    ['progress', [todo({ id: 'a' })]],
    ['done', [todo({ id: 'a', status: 'successful' })]],
    ['empty', []],
  ])('header band shows the %s mood', (mood, todos) => {
    mockLists(todos);
    renderPage();
    expect(screen.getByTestId('today-header')).toHaveAttribute(
      'data-mood',
      mood
    );
  });

  test('shows the inbox as its own section listing inbox tasks', () => {
    renderPage();
    const inbox = within(screen.getByTestId('dashboard-inbox-section'));
    expect(inbox.getByText('dashboard.inboxTitle')).toBeInTheDocument();
    expect(inbox.getByText('buy shoes')).toBeInTheDocument();
    expect(inbox.queryByText('Go to Kik')).not.toBeInTheDocument();
  });

  test('keeps completed and later-dated tasks out of the inbox panel', () => {
    useInboxTodosQuery.mockReturnValue({
      data: [
        todo({ id: 'i1', name: 'sort me', todolistId: null, dueDate: null }),
        todo({
          id: 'i2',
          name: 'already done',
          todolistId: null,
          dueDate: null,
          status: 'successful',
        }),
        todo({
          id: 'i3',
          name: 'next month',
          todolistId: null,
          dueDate: '2026-09-20',
        }),
        todo({ id: 'i4', name: 'inbox today', todolistId: null }),
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchInbox,
    });
    renderPage();
    const inbox = within(screen.getByTestId('dashboard-inbox-section'));
    expect(inbox.getByText('sort me')).toBeInTheDocument();
    expect(inbox.queryByText('already done')).not.toBeInTheDocument();
    expect(inbox.queryByText('next month')).not.toBeInTheDocument();
    expect(inbox.getByText('inbox today')).toBeInTheDocument();
    expect(
      within(screen.getByTestId('today-due')).getByText('inbox today')
    ).toBeInTheDocument();
  });

  test('opens an inbox task on the Tasks page when it is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderPage();
    await user.click(
      within(screen.getByTestId('dashboard-inbox-section')).getByRole(
        'button',
        { name: /buy shoes/ }
      )
    );
    expect(mockNavigate).toHaveBeenCalledWith('/tasks', {
      state: { todoId: 't2', listId: null },
    });
  });

  test('opens a top-priority task on the Tasks page when it is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockLists([todo({ id: 'urgent', name: 'File taxes', priority: 'high' })]);
    renderPage();
    await user.click(
      within(screen.getByTestId('today-top-priority')).getByRole('button', {
        name: /File taxes/,
      })
    );
    expect(mockNavigate).toHaveBeenCalledWith('/tasks', {
      state: { todoId: 'urgent', listId: 'l1' },
    });
  });

  test('pages through inbox tasks three at a time', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    useInboxTodosQuery.mockReturnValue({
      data: [0, 1, 2, 3].map((n) =>
        todo({
          id: `in-${n}`,
          name: `inbox ${n}`,
          todolistId: null,
          dueDate: null,
          order: n,
        })
      ),
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchInbox,
    });
    renderPage();
    const inbox = within(screen.getByTestId('dashboard-inbox-section'));
    expect(inbox.getByText('inbox 2')).toBeInTheDocument();
    expect(inbox.queryByText('inbox 3')).not.toBeInTheDocument();

    await user.click(
      inbox.getByRole('button', { name: 'dashboard.nextTasks' })
    );
    expect(inbox.getByText('inbox 3')).toBeInTheDocument();
    expect(inbox.queryByText('inbox 0')).not.toBeInTheDocument();
  });

  test('always shows arrows in Top Priority and Inbox, disabled on one page', () => {
    renderPage();
    for (const testId of ['today-top-priority', 'dashboard-inbox-section']) {
      const block = within(screen.getByTestId(testId));
      expect(
        block.getByRole('button', { name: 'dashboard.previousTasks' })
      ).toBeDisabled();
      expect(
        block.getByRole('button', { name: 'dashboard.nextTasks' })
      ).toBeDisabled();
    }
  });

  test('shows an empty message when the inbox has no tasks', () => {
    useInboxTodosQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchInbox,
    });
    renderPage();
    expect(
      within(screen.getByTestId('dashboard-inbox-section')).getByText(
        'dashboard.inboxEmpty'
      )
    ).toBeInTheDocument();
  });

  test('the Add task button opens the add form on the Vital Tasks page', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderPage();
    await user.click(screen.getByTestId('today-add-task-button'));
    expect(mockNavigate).toHaveBeenCalledWith('/vital', {
      state: { openAddTask: true },
    });
  });

  test('shows a skeleton placeholder while todo lists or inbox are loading', () => {
    useTodoListsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: refetchTodoLists,
    });
    renderPage();
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
    renderPage();
    expect(screen.getByText('network down')).toBeInTheDocument();
    screen.getByText('Try again').click();
    expect(refetchTodoLists).toHaveBeenCalled();
    expect(refetchInbox).toHaveBeenCalled();
  });
});
