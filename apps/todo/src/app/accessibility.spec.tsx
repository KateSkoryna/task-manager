import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TodoItem, TodoList, UserPreferences } from '@shared/types';
import { expectNoAxeViolations } from '../test-support/axe';
import BottomNav from './component/elements/BottomNav';
import DashboardPage from './component/pages/DashboardPage';
import HelpPage from './component/pages/HelpPage';
import SettingsPage from './component/pages/SettingsPage';
import TasksPage from './component/pages/TasksPage';
import VitalTaskPage from './component/pages/VitalTaskPage';
import { initialListViewState, useListViewStore } from './store/listViewStore';

// One axe check per page component, rendered the way its own spec does.
// axe in jsdom judges labels, accessible names, roles and ARIA validity. It
// cannot judge colour contrast or tap-target size: those need a real browser
// (Lighthouse).

const TODAY = '2026-08-19';

const todo = (overrides: Partial<TodoItem> & { id: string }): TodoItem => ({
  name: overrides.id,
  status: 'pending',
  todolistId: 'l1',
  order: 0,
  dueDate: TODAY,
  priority: 'medium',
  source: 'web',
  ...overrides,
});

const LIST: TodoList = {
  id: 'l1',
  name: 'Groceries',
  userId: 'u1',
  priority: 'high',
  todos: [
    todo({ id: 't1', name: 'Buy milk' }),
    todo({ id: 't2', name: 'Buy bread', priority: 'high', order: 1 }),
  ],
};

const INBOX: TodoItem[] = [
  todo({ id: 't3', name: 'Call the bank', todolistId: null, dueDate: null }),
];

const PREFERENCES: UserPreferences = {
  timezone: 'Europe/Berlin',
  locale: 'en',
  reportCadence: 'daily',
  deliveryHour: 9,
  tone: 'neutral',
  aiConsent: false,
  autoArchive: 'never',
  onboardingSeen: false,
};

jest.mock('./lib/imageUtils', () => ({ uploadImage: jest.fn() }));
jest.mock('./lib/firebase', () => ({ auth: {} }));
jest.mock('firebase/auth', () => ({
  signOut: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('./store/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({
      user: {
        firebaseUid: 'u1',
        displayName: 'Ada Lovelace',
        email: 'ada@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
      },
      logout: jest.fn(),
    }),
}));

jest.mock('./hooks/usePreferences', () => ({
  usePreferences: () => ({
    preferences: PREFERENCES,
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
    updatePreferences: jest.fn(),
    isUpdating: false,
  }),
}));

jest.mock('./hooks/useTodoListsData', () => ({
  useTodoListsData: () => ({
    todoLists: [LIST],
    inboxTodos: INBOX,
    archivedEntries: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
    handleCreateList: jest.fn(),
    handleDeleteList: jest.fn(),
    handleEditList: jest.fn(),
    handleAddTodo: jest.fn(),
    handleDeleteTodo: jest.fn(),
    handleToggleTodo: jest.fn(),
    handleEditTodo: jest.fn(),
    handleArchiveTodo: jest.fn(),
    handleRestoreTodo: jest.fn(),
    handleReorderTodos: jest.fn(),
    createListMutationIsPending: false,
  }),
}));

jest.mock('./fetchers/api', () => ({
  ...jest.requireActual('./fetchers/api'),
  useTodoListsQuery: () => ({
    data: [LIST],
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
  }),
  useInboxTodosQuery: () => ({
    data: INBOX,
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
  }),
  useToggleTodoMutation: () => ({ mutate: jest.fn() }),
}));

jest.mock('./hooks/useHeaderTaskSearch', () => ({
  useHeaderTaskSearch: () => ({
    query: '',
    setQuery: jest.fn(),
    status: 'idle',
    matches: [],
    clear: jest.fn(),
  }),
}));

// The tour needs a query client and driver.js; recharts measures a layout
// jsdom does not have.
jest.mock('./component/onboarding/OnboardingTour', () => () => null);
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  PieChart: () => null,
  Pie: () => null,
  Cell: () => null,
}));

function renderPage(page: React.ReactElement) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>{page}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('accessibility (axe)', () => {
  beforeEach(() => {
    useListViewStore.setState(initialListViewState);
    // Only the clock is faked: axe schedules its work with real timers.
    jest.useFakeTimers({
      now: new Date(`${TODAY}T09:00:00`),
      doNotFake: [
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
        'setImmediate',
        'clearImmediate',
        'nextTick',
        'queueMicrotask',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'performance',
      ],
    });
  });

  afterEach(() => jest.useRealTimers());

  test('Dashboard', async () => {
    const { container } = renderPage(<DashboardPage />);
    await expectNoAxeViolations(container);
  });

  test('Tasks', async () => {
    const { container } = renderPage(<TasksPage />);
    await expectNoAxeViolations(container);
  });

  test('Vital tasks', async () => {
    const { container } = renderPage(<VitalTaskPage />);
    await expectNoAxeViolations(container);
  });

  test('Vital tasks with a task selected', async () => {
    const { container } = renderPage(<VitalTaskPage />);
    await userEvent.click(screen.getByTestId('todo-item-t1'));
    await expectNoAxeViolations(container);
  });

  test('Settings', async () => {
    const { container } = renderPage(<SettingsPage />);
    await expectNoAxeViolations(container);
  });

  test('Help', async () => {
    const { container } = renderPage(<HelpPage />);
    await expectNoAxeViolations(container);
  });

  test('Bottom tab bar', async () => {
    const { container } = renderPage(<BottomNav />);
    await expectNoAxeViolations(container);
  });
});
