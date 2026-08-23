import { createElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { UserPreferences } from '@shared/types';
import { usePreferences } from './usePreferences';
import { useAuthStore } from '../store/authStore';

jest.mock('../lib/firebase', () => ({ auth: {} }));
jest.mock('firebase/auth', () => ({ signOut: jest.fn() }));

const DEFAULT_PREFERENCES: UserPreferences = {
  timezone: 'UTC',
  locale: 'en',
  reportCadence: 'off',
  deliveryHour: 9,
  tone: 'neutral',
  aiConsent: false,
};

const getPreferencesFetcher = jest.fn();
const updatePreferencesFetcher = jest.fn();

jest.mock('../fetchers/preferences', () => ({
  getPreferencesFetcher: (...args: unknown[]) => getPreferencesFetcher(...args),
  updatePreferencesFetcher: (...args: unknown[]) =>
    updatePreferencesFetcher(...args),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('usePreferences', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: 'user-1',
        firebaseUid: 'firebase-1',
        email: 'a@example.com',
        displayName: 'A',
        firstName: 'A',
        lastName: 'A',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        preferences: DEFAULT_PREFERENCES,
        telegramLinked: false,
      },
      isLoading: false,
    });
    getPreferencesFetcher.mockResolvedValue(DEFAULT_PREFERENCES);
  });

  afterEach(() => {
    act(() => {
      useAuthStore.setState({ user: null, isLoading: true });
    });
    jest.clearAllMocks();
  });

  it('loads preferences on mount', async () => {
    const { result } = renderHook(() => usePreferences(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.preferences).toEqual(DEFAULT_PREFERENCES);
    expect(getPreferencesFetcher).toHaveBeenCalledWith('user-1');
  });

  it('persists a successful update', async () => {
    const updated: UserPreferences = { ...DEFAULT_PREFERENCES, tone: 'direct' };
    updatePreferencesFetcher.mockResolvedValue(updated);
    // The mutation succeeding invalidates the query, which refetches — the
    // second call simulates the server now reflecting the update.
    getPreferencesFetcher
      .mockResolvedValueOnce(DEFAULT_PREFERENCES)
      .mockResolvedValue(updated);

    const { result } = renderHook(() => usePreferences(), {
      wrapper: createWrapper(),
    });
    await waitFor(() =>
      expect(result.current.preferences).toEqual(DEFAULT_PREFERENCES)
    );

    act(() => {
      result.current.updatePreferences({ tone: 'direct' });
    });

    await waitFor(() =>
      expect(result.current.preferences?.tone).toBe('direct')
    );
    expect(updatePreferencesFetcher).toHaveBeenCalledWith('user-1', {
      tone: 'direct',
    });
  });

  it('rolls back an optimistic update when the request fails', async () => {
    let rejectUpdate!: (error: Error) => void;
    updatePreferencesFetcher.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectUpdate = reject;
      })
    );

    const { result } = renderHook(() => usePreferences(), {
      wrapper: createWrapper(),
    });
    await waitFor(() =>
      expect(result.current.preferences).toEqual(DEFAULT_PREFERENCES)
    );

    act(() => {
      result.current.updatePreferences({ tone: 'direct' });
    });

    // Applied optimistically before the mutation settles.
    await waitFor(() =>
      expect(result.current.preferences?.tone).toBe('direct')
    );

    act(() => {
      rejectUpdate(new Error('network error'));
    });

    // Rolled back once the request fails.
    await waitFor(() =>
      expect(result.current.preferences).toEqual(DEFAULT_PREFERENCES)
    );
  });
});
