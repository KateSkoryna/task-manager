import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Report, User } from '@shared/types';
import { DEFAULT_USER_PREFERENCES } from '@shared/types';
import ReportDetailPage from './ReportDetailPage';
import { useAuthStore } from '../../store/authStore';

// ReportDetailPage pulls in authStore, which imports firebase/auth. jsdom's
// Jest environment resolves that to firebase's Node build, which needs a
// global `fetch` this test env doesn't provide — the same reason
// TopHeader.spec.tsx and authStore.spec.ts mock these two modules.
jest.mock('../../lib/firebase', () => ({ auth: {} }));
jest.mock('firebase/auth', () => ({
  signOut: jest.fn().mockResolvedValue(undefined),
}));

const mockReport: Report = {
  id: 'r1',
  userId: 'u1',
  name: 'Weekly report — Mar 16 – Mar 22, 2026',
  period: 'weekly',
  periodStart: '2026-03-16T00:00:00.000Z',
  periodEnd: '2026-03-22T23:59:59.999Z',
  metrics: {
    dueCount: 3,
    completedCount: 2,
    createdCount: 3,
    overdueCount: 1,
    completionRatio: 0.67,
    onTimeRate: 0.33,
    proactivityScore: 47,
  },
  taskSnapshot: [
    {
      id: 't1',
      name: 'Buy groceries',
      status: 'successful',
      category: 'home',
      priority: 'high',
      dueDate: '2026-03-17T09:00:00.000Z',
      completedAt: '2026-03-17T08:00:00.000Z',
      createdAt: '2026-03-16T00:00:00.000Z',
    },
    {
      id: 't2',
      name: 'Write report',
      status: 'pending',
      category: 'work',
      priority: 'medium',
      dueDate: '2026-03-18T09:00:00.000Z',
      completedAt: null,
      createdAt: '2026-03-16T00:00:00.000Z',
    },
  ],
  narrative: null,
  narrativeAttempts: 0,
  deliveredAt: null,
  createdAt: '2026-03-22T23:59:59.999Z',
};

const useReportQuery = jest.fn();
const useGenerateReportNarrativeMutation = jest.fn();

jest.mock('../../fetchers/api', () => ({
  useReportQuery: (...args: unknown[]) => useReportQuery(...args),
  useGenerateReportNarrativeMutation: () =>
    useGenerateReportNarrativeMutation(),
}));

const mockUsePreferences = jest.fn();
jest.mock('../../hooks/usePreferences', () => ({
  usePreferences: () => mockUsePreferences(),
}));

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/reports/r1']}>
      <Routes>
        <Route path="/reports/:reportId" element={<ReportDetailPage />} />
      </Routes>
    </MemoryRouter>
  );

describe('ReportDetailPage', () => {
  beforeEach(() => {
    useGenerateReportNarrativeMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
    });
    mockUsePreferences.mockReturnValue({
      preferences: { aiConsent: false },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null });
  });

  it('renders KPI tiles and a category chart from the report response', () => {
    useReportQuery.mockReturnValue({ data: mockReport, isLoading: false });

    renderPage();

    expect(
      screen.getByText('Weekly report — Mar 16 – Mar 22, 2026')
    ).toBeInTheDocument();
    expect(screen.getByText('47')).toBeInTheDocument();
    expect(screen.getByText('67%')).toBeInTheDocument();
    expect(screen.getByText('33%')).toBeInTheDocument();
    expect(
      screen.getByText('statistics.categoryDistribution')
    ).toBeInTheDocument();
  });

  it("shows the signed-in user's name on the report", () => {
    useReportQuery.mockReturnValue({ data: mockReport, isLoading: false });
    const mockUser: User = {
      id: 'u1',
      firebaseUid: 'fb1',
      email: 'kate@example.com',
      displayName: 'Kate Skoryna',
      firstName: 'Kate',
      lastName: 'Skoryna',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      preferences: DEFAULT_USER_PREFERENCES,
      telegramLinked: false,
    };
    useAuthStore.setState({ user: mockUser });

    renderPage();

    expect(screen.getByText('reports.preparedFor')).toBeInTheDocument();
  });

  it('offers to generate AI insights when the user has enabled AI, and calls the mutation on click', () => {
    useReportQuery.mockReturnValue({ data: mockReport, isLoading: false });
    mockUsePreferences.mockReturnValue({ preferences: { aiConsent: true } });
    const mutate = jest.fn();
    useGenerateReportNarrativeMutation.mockReturnValue({
      mutate,
      isPending: false,
      isError: false,
    });

    renderPage();

    fireEvent.click(screen.getByText('reports.getInsights'));

    expect(mutate).toHaveBeenCalledWith({ reportId: 'r1' });
  });

  it('shows the narrative once the report has one, without requiring AI consent', () => {
    useReportQuery.mockReturnValue({
      data: {
        ...mockReport,
        narrative: {
          summary: 'You completed most of your tasks.',
          problems: ['1 task overdue in Work'],
          reasoning: ['Work tasks are due mid-week, easy to miss'],
          tips: ['Review Work tasks on Mondays'],
        },
      },
      isLoading: false,
    });
    mockUsePreferences.mockReturnValue({ preferences: { aiConsent: false } });

    renderPage();

    expect(
      screen.getByText('You completed most of your tasks.')
    ).toBeInTheDocument();
    expect(screen.getByText('1 task overdue in Work')).toBeInTheDocument();
    expect(
      screen.getByText('Work tasks are due mid-week, easy to miss')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Review Work tasks on Mondays')
    ).toBeInTheDocument();
    expect(screen.queryByText('reports.getInsights')).not.toBeInTheDocument();
  });

  it('hides the generate button and shows a limit message once attempts are exhausted', () => {
    useReportQuery.mockReturnValue({
      data: { ...mockReport, narrativeAttempts: 2 },
      isLoading: false,
    });
    mockUsePreferences.mockReturnValue({ preferences: { aiConsent: true } });

    renderPage();

    expect(screen.queryByText('reports.getInsights')).not.toBeInTheDocument();
    expect(
      screen.getByText('reports.insightsLimitReached')
    ).toBeInTheDocument();
  });

  it('hides the AI insights section entirely with no consent and no narrative yet', () => {
    useReportQuery.mockReturnValue({ data: mockReport, isLoading: false });
    mockUsePreferences.mockReturnValue({ preferences: { aiConsent: false } });

    renderPage();

    expect(
      screen.queryByText('reports.aiInsightsTitle')
    ).not.toBeInTheDocument();
  });

  it('shows the loading state while the query resolves', () => {
    useReportQuery.mockReturnValue({ data: undefined, isLoading: true });

    renderPage();

    expect(screen.getByText('reports.loading')).toBeInTheDocument();
  });
});
