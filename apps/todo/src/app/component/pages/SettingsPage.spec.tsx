import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserPreferences } from '@shared/types';
import SettingsPage from './SettingsPage';

const PREFERENCES: UserPreferences = {
  timezone: 'Europe/Berlin',
  locale: 'en',
  reportCadence: 'daily',
  deliveryHour: 9,
  tone: 'neutral',
  aiConsent: false,
};

const usePreferences = jest.fn();
const updatePreferences = jest.fn();
const refetch = jest.fn();

jest.mock('../../hooks/usePreferences', () => ({
  usePreferences: () => usePreferences(),
}));

describe('SettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePreferences.mockReturnValue({
      preferences: PREFERENCES,
      isLoading: false,
      isError: false,
      error: null,
      refetch,
      updatePreferences,
      isUpdating: false,
    });
  });

  it('shows a skeleton while preferences are loading', () => {
    usePreferences.mockReturnValue({
      preferences: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch,
      updatePreferences,
      isUpdating: false,
    });

    render(<SettingsPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByTestId('settings-timezone')).not.toBeInTheDocument();
  });

  it('shows an error state with a retry when loading fails', () => {
    usePreferences.mockReturnValue({
      preferences: undefined,
      isLoading: false,
      isError: true,
      error: new Error('network down'),
      refetch,
      updatePreferences,
      isUpdating: false,
    });

    render(<SettingsPage />);
    expect(screen.getByTestId('error-message')).toHaveTextContent(
      'network down'
    );
  });

  it('loads and displays every stored preference', () => {
    render(<SettingsPage />);

    expect(screen.getByTestId('settings-timezone')).toHaveValue(
      'Europe/Berlin'
    );
    expect(screen.getByLabelText('settings.reportCadence')).toHaveTextContent(
      'settings.cadence_daily'
    );
    expect(screen.getByLabelText('settings.tone')).toHaveTextContent(
      'settings.tone_neutral'
    );
  });

  it('disables the delivery hour control when cadence is off', async () => {
    usePreferences.mockReturnValue({
      preferences: { ...PREFERENCES, reportCadence: 'off' },
      isLoading: false,
      isError: false,
      error: null,
      refetch,
      updatePreferences,
      isUpdating: false,
    });

    render(<SettingsPage />);
    const hourControl = screen.getByLabelText('settings.deliveryHour');
    expect(hourControl).toHaveAttribute('aria-disabled', 'true');

    await userEvent.click(hourControl);
    expect(screen.queryByRole('button', { name: /9/ })).not.toBeInTheDocument();
  });

  it('saves an edited preference and shows confirmation', async () => {
    updatePreferences.mockImplementation((_data, options) =>
      options?.onSuccess?.()
    );
    render(<SettingsPage />);

    await userEvent.click(screen.getByLabelText('settings.tone'));
    await userEvent.click(
      screen.getByRole('button', { name: 'settings.tone_direct' })
    );
    await userEvent.click(screen.getByTestId('settings-save-button'));

    await waitFor(() =>
      expect(updatePreferences).toHaveBeenCalledWith(
        expect.objectContaining({ tone: 'direct' }),
        expect.any(Object)
      )
    );
    expect(screen.getByTestId('settings-saved-message')).toBeInTheDocument();
  });

  it('shows an error and keeps the entered values when saving fails', async () => {
    updatePreferences.mockImplementation((_data, options) =>
      options?.onError?.()
    );
    render(<SettingsPage />);

    await userEvent.click(screen.getByLabelText('settings.tone'));
    await userEvent.click(
      screen.getByRole('button', { name: 'settings.tone_direct' })
    );
    await userEvent.click(screen.getByTestId('settings-save-button'));

    await waitFor(() =>
      expect(screen.getByTestId('settings-save-error')).toBeInTheDocument()
    );
    expect(screen.getByLabelText('settings.tone')).toHaveTextContent(
      'settings.tone_direct'
    );
    expect(
      screen.queryByTestId('settings-saved-message')
    ).not.toBeInTheDocument();
  });
});
