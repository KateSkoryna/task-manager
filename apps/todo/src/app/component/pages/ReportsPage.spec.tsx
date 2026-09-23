import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Report } from '@shared/types';
import ReportsPage from './ReportsPage';

const weeklyReports: Report[] = [
  {
    id: 'r2',
    userId: 'u1',
    name: 'Weekly report — Mar 16 – Mar 22, 2026',
    period: 'weekly',
    periodStart: '2026-03-16T00:00:00.000Z',
    periodEnd: '2026-03-22T23:59:59.999Z',
    metrics: {
      dueCount: 4,
      completedCount: 3,
      createdCount: 5,
      overdueCount: 1,
      completionRatio: 0.75,
      onTimeRate: 0.5,
      proactivityScore: 65,
    },
    taskSnapshot: [],
    narrative: null,
    narrativeAttempts: 0,
    deliveredAt: null,
    createdAt: '2026-03-22T23:59:59.999Z',
  },
  {
    id: 'r1',
    userId: 'u1',
    name: 'Weekly report — Mar 9 – Mar 15, 2026',
    period: 'weekly',
    periodStart: '2026-03-09T00:00:00.000Z',
    periodEnd: '2026-03-15T23:59:59.999Z',
    metrics: {
      dueCount: 2,
      completedCount: 2,
      createdCount: 2,
      overdueCount: 0,
      completionRatio: 1,
      onTimeRate: 1,
      proactivityScore: 100,
    },
    taskSnapshot: [],
    narrative: null,
    narrativeAttempts: 0,
    deliveredAt: null,
    createdAt: '2026-03-15T23:59:59.999Z',
  },
];

const useReportsQuery = jest.fn();
const fetchNextPage = jest.fn();

jest.mock('../../fetchers/api', () => ({
  useReportsQuery: (...args: unknown[]) => useReportsQuery(...args),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <ReportsPage />
    </MemoryRouter>
  );

describe('ReportsPage', () => {
  beforeEach(() => {
    useReportsQuery.mockReturnValue({
      data: { pages: [{ items: weeklyReports, nextCursor: null }] },
      isLoading: false,
      fetchNextPage,
      hasNextPage: false,
      isFetchingNextPage: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('lists every fetched report by name', () => {
    renderPage();

    expect(
      screen.getByText('Weekly report — Mar 16 – Mar 22, 2026')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Weekly report — Mar 9 – Mar 15, 2026')
    ).toBeInTheDocument();
  });

  it('search narrows the list to matching names', () => {
    renderPage();

    fireEvent.change(screen.getByPlaceholderText('reports.searchPlaceholder'), {
      target: { value: 'Mar 16' },
    });

    expect(
      screen.getByText('Weekly report — Mar 16 – Mar 22, 2026')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Weekly report — Mar 9 – Mar 15, 2026')
    ).not.toBeInTheDocument();
  });

  it('switches the query period when a different filter option is selected', () => {
    renderPage();

    fireEvent.click(screen.getByText('reports.monthly'));

    expect(useReportsQuery).toHaveBeenLastCalledWith('monthly', 'desc');
  });

  it('toggling sort re-queries in the opposite direction', () => {
    renderPage();

    fireEvent.click(screen.getByLabelText('reports.sortOldest'));

    expect(useReportsQuery).toHaveBeenLastCalledWith('weekly', 'asc');
  });

  it('"load more" fetches the next page when more results remain', () => {
    useReportsQuery.mockReturnValue({
      data: { pages: [{ items: weeklyReports, nextCursor: 'cursor-1' }] },
      isLoading: false,
      fetchNextPage,
      hasNextPage: true,
      isFetchingNextPage: false,
    });

    renderPage();
    fireEvent.click(screen.getByText('reports.loadMore'));

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it('shows the loading state while the query resolves', () => {
    useReportsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      fetchNextPage,
      hasNextPage: false,
      isFetchingNextPage: false,
    });

    renderPage();

    expect(screen.getByText('reports.loading')).toBeInTheDocument();
  });
});
