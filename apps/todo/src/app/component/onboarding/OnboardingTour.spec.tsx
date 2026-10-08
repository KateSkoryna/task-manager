import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import OnboardingTour from './OnboardingTour';
import { REPLAY_TOUR_STATE } from './tourSteps';

const mockUpdatePreferences = jest.fn();
const mockUsePreferences = jest.fn();
const mockDrive = jest.fn();
const mockDestroy = jest.fn();
const mockDriver = jest.fn();

jest.mock('../../hooks/usePreferences', () => ({
  usePreferences: () => mockUsePreferences(),
}));

jest.mock('./loadDriver', () => ({
  loadDriver: () => Promise.resolve(mockDriver),
}));

function setPreferences(onboardingSeen: boolean | undefined) {
  mockUsePreferences.mockReturnValue({
    preferences: onboardingSeen === undefined ? undefined : { onboardingSeen },
    updatePreferences: mockUpdatePreferences,
  });
}

function renderTour(state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/', state }]}>
      <OnboardingTour />
    </MemoryRouter>
  );
}

/** The config the component handed to driver(), to inspect or call back into. */
function driverConfig() {
  return mockDriver.mock.calls[0][0];
}

beforeEach(() => {
  jest.clearAllMocks();
  mockDriver.mockReturnValue({
    drive: mockDrive,
    destroy: mockDestroy,
    isActive: () => true,
  });
});

describe('OnboardingTour', () => {
  it('starts for a user who has not seen it, from the Today stop to the Add task stop', async () => {
    setPreferences(false);
    renderTour();

    await waitFor(() => expect(mockDrive).toHaveBeenCalledTimes(1));
    const titles = driverConfig().steps.map(
      (step: { popover: { title: string } }) => step.popover.title
    );
    expect(driverConfig().disableActiveInteraction).toBe(true);
    expect(titles[0]).toBe('onboarding.todayTitle');
    expect(titles[titles.length - 1]).toBe('onboarding.addTitle');
  });

  it('can be skipped, and then counts as seen', async () => {
    setPreferences(false);
    renderTour();
    await waitFor(() => expect(mockDrive).toHaveBeenCalled());

    // driver.js calls this when the tour is closed, finished or skipped.
    driverConfig().onDestroyStarted();

    expect(mockDestroy).toHaveBeenCalled();
    expect(mockUpdatePreferences).toHaveBeenCalledWith({
      onboardingSeen: true,
    });
  });

  it('does not count as seen when the page is left mid-tour', async () => {
    setPreferences(false);
    const { unmount } = renderTour();
    await waitFor(() => expect(mockDrive).toHaveBeenCalled());

    unmount();

    expect(mockDestroy).toHaveBeenCalled();
    expect(mockUpdatePreferences).not.toHaveBeenCalled();
  });

  it('does not restart when a failed save rolls the flag back', async () => {
    setPreferences(false);
    const { rerender } = renderTour();
    await waitFor(() => expect(mockDrive).toHaveBeenCalledTimes(1));

    setPreferences(true);
    rerender(
      <MemoryRouter>
        <OnboardingTour />
      </MemoryRouter>
    );
    setPreferences(false);
    rerender(
      <MemoryRouter>
        <OnboardingTour />
      </MemoryRouter>
    );

    await Promise.resolve();
    expect(mockDrive).toHaveBeenCalledTimes(1);
  });

  it('does not appear again once it has been seen', async () => {
    setPreferences(true);
    renderTour();

    await Promise.resolve();
    expect(mockDriver).not.toHaveBeenCalled();
  });

  it('waits for preferences to load before deciding', async () => {
    setPreferences(undefined);
    renderTour();

    await Promise.resolve();
    expect(mockDriver).not.toHaveBeenCalled();
  });

  it('can be replayed, without touching the stored flag', async () => {
    setPreferences(true);
    renderTour(REPLAY_TOUR_STATE);

    await waitFor(() => expect(mockDrive).toHaveBeenCalledTimes(1));
    driverConfig().onDestroyStarted();

    expect(mockUpdatePreferences).not.toHaveBeenCalled();
  });
});
