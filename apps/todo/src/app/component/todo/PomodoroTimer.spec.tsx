import { act, fireEvent, render, screen } from '@testing-library/react';
import PomodoroTimer from './PomodoroTimer';
import { playChime } from '../../lib/pomodoroSound';

jest.mock('../../lib/pomodoroSound', () => ({
  playChime: jest.fn(),
}));

class MockNotification {
  static permission: NotificationPermission = 'default';
  static requestPermission = jest.fn().mockResolvedValue('granted');
  static instances: { title: string; body?: string }[] = [];

  constructor(title: string, options?: { body?: string }) {
    MockNotification.instances.push({ title, body: options?.body });
  }
}

describe('PomodoroTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    MockNotification.permission = 'default';
    MockNotification.instances = [];
    delete (global as { Notification?: unknown }).Notification;
  });

  test('shows the task name and the full work duration before starting', () => {
    render(<PomodoroTimer taskName="Write report" />);
    expect(screen.getByText('Write report')).toBeInTheDocument();
    expect(screen.getByTestId('pomodoro-time')).toHaveTextContent('25:00');
    expect(screen.getByText('pomodoro.start')).toBeInTheDocument();
  });

  test('counts down after clicking start and toggles to pause', () => {
    render(<PomodoroTimer taskName="Write report" />);
    fireEvent.click(screen.getByText('pomodoro.start'));
    expect(screen.getByText('pomodoro.pause')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(screen.getByTestId('pomodoro-time')).toHaveTextContent('24:57');
  });

  test('reset returns the timer to the full work duration', () => {
    render(<PomodoroTimer taskName="Write report" />);
    fireEvent.click(screen.getByText('pomodoro.start'));
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    fireEvent.click(screen.getByText('pomodoro.reset'));
    expect(screen.getByTestId('pomodoro-time')).toHaveTextContent('25:00');
    expect(screen.getByText('pomodoro.start')).toBeInTheDocument();
  });

  test('reset always restores the default 25 minutes, even after a custom duration', () => {
    render(<PomodoroTimer taskName="Write report" />);
    fireEvent.click(screen.getByTestId('pomodoro-time'));
    fireEvent.change(screen.getByTestId('pomodoro-minutes-input'), {
      target: { value: '10' },
    });
    fireEvent.keyDown(screen.getByTestId('pomodoro-minutes-input'), {
      key: 'Enter',
    });
    expect(screen.getByTestId('pomodoro-time')).toHaveTextContent('10:00');

    fireEvent.click(screen.getByText('pomodoro.start'));
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    fireEvent.click(screen.getByText('pomodoro.reset'));
    expect(screen.getByTestId('pomodoro-time')).toHaveTextContent('25:00');
  });

  test('calls onPhaseComplete when the work phase finishes', () => {
    const onPhaseComplete = jest.fn();
    render(
      <PomodoroTimer
        taskName="Write report"
        onPhaseComplete={onPhaseComplete}
      />
    );
    fireEvent.click(screen.getByText('pomodoro.start'));
    act(() => {
      jest.advanceTimersByTime(25 * 60 * 1000);
    });
    expect(onPhaseComplete).toHaveBeenCalledWith('work');
    expect(screen.getByText('pomodoro.breakPhase')).toBeInTheDocument();
  });

  test('clicking the countdown opens minutes and seconds editors', () => {
    render(<PomodoroTimer taskName="Write report" />);
    fireEvent.click(screen.getByTestId('pomodoro-time'));
    expect(screen.getByTestId('pomodoro-minutes-input')).toHaveValue('25');
    expect(screen.getByTestId('pomodoro-seconds-input')).toHaveValue('00');
  });

  test('editing minutes and seconds and pressing Enter updates the countdown', () => {
    render(<PomodoroTimer taskName="Write report" />);
    fireEvent.click(screen.getByTestId('pomodoro-time'));
    fireEvent.change(screen.getByTestId('pomodoro-minutes-input'), {
      target: { value: '10' },
    });
    fireEvent.change(screen.getByTestId('pomodoro-seconds-input'), {
      target: { value: '30' },
    });
    fireEvent.keyDown(screen.getByTestId('pomodoro-seconds-input'), {
      key: 'Enter',
    });
    expect(screen.getByTestId('pomodoro-time')).toHaveTextContent('10:30');
  });

  test('starts counting down from the edited duration', () => {
    render(<PomodoroTimer taskName="Write report" />);
    fireEvent.click(screen.getByTestId('pomodoro-time'));
    fireEvent.change(screen.getByTestId('pomodoro-minutes-input'), {
      target: { value: '10' },
    });
    fireEvent.keyDown(screen.getByTestId('pomodoro-minutes-input'), {
      key: 'Enter',
    });
    fireEvent.click(screen.getByText('pomodoro.start'));
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(screen.getByTestId('pomodoro-time')).toHaveTextContent('09:57');
  });

  test('cannot open the editor once the timer is running', () => {
    render(<PomodoroTimer taskName="Write report" />);
    fireEvent.click(screen.getByText('pomodoro.start'));
    fireEvent.click(screen.getByTestId('pomodoro-time'));
    expect(
      screen.queryByTestId('pomodoro-minutes-input')
    ).not.toBeInTheDocument();
  });

  test('clamps typed minutes live to a maximum of 99', () => {
    render(<PomodoroTimer taskName="Write report" />);
    fireEvent.click(screen.getByTestId('pomodoro-time'));
    fireEvent.change(screen.getByTestId('pomodoro-minutes-input'), {
      target: { value: '150' },
    });
    expect(screen.getByTestId('pomodoro-minutes-input')).toHaveValue('99');
  });

  test('clamps typed seconds live to a maximum of 59', () => {
    render(<PomodoroTimer taskName="Write report" />);
    fireEvent.click(screen.getByTestId('pomodoro-time'));
    fireEvent.change(screen.getByTestId('pomodoro-seconds-input'), {
      target: { value: '75' },
    });
    expect(screen.getByTestId('pomodoro-seconds-input')).toHaveValue('59');
  });

  test('enables Start live as soon as a valid duration is typed, without pressing Enter', () => {
    render(<PomodoroTimer taskName="Write report" />);
    fireEvent.click(screen.getByTestId('pomodoro-time'));
    fireEvent.change(screen.getByTestId('pomodoro-minutes-input'), {
      target: { value: '0' },
    });
    fireEvent.change(screen.getByTestId('pomodoro-seconds-input'), {
      target: { value: '3' },
    });
    expect(screen.getByTestId('pomodoro-start')).toBeDisabled();

    fireEvent.change(screen.getByTestId('pomodoro-seconds-input'), {
      target: { value: '15' },
    });
    expect(screen.getByTestId('pomodoro-start')).not.toBeDisabled();
  });

  test('starts using the freshly typed duration when clicked before pressing Enter', () => {
    render(<PomodoroTimer taskName="Write report" />);
    fireEvent.click(screen.getByTestId('pomodoro-time'));
    fireEvent.change(screen.getByTestId('pomodoro-minutes-input'), {
      target: { value: '0' },
    });
    fireEvent.change(screen.getByTestId('pomodoro-seconds-input'), {
      target: { value: '15' },
    });
    fireEvent.click(screen.getByTestId('pomodoro-start'));

    expect(screen.getByText('pomodoro.pause')).toBeInTheDocument();
    expect(screen.getByTestId('pomodoro-time')).toHaveTextContent('00:15');

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(screen.getByTestId('pomodoro-time')).toHaveTextContent('00:12');
  });

  test('does not clamp an edited duration below the minimum, but disables Start', () => {
    render(<PomodoroTimer taskName="Write report" />);
    fireEvent.click(screen.getByTestId('pomodoro-time'));
    fireEvent.change(screen.getByTestId('pomodoro-minutes-input'), {
      target: { value: '0' },
    });
    fireEvent.change(screen.getByTestId('pomodoro-seconds-input'), {
      target: { value: '3' },
    });
    fireEvent.keyDown(screen.getByTestId('pomodoro-seconds-input'), {
      key: 'Enter',
    });
    expect(screen.getByTestId('pomodoro-time')).toHaveTextContent('00:03');
    expect(screen.getByTestId('pomodoro-start')).toBeDisabled();

    fireEvent.click(screen.getByTestId('pomodoro-start'));
    expect(screen.getByText('pomodoro.start')).toBeInTheDocument();
    expect(screen.queryByText('pomodoro.pause')).not.toBeInTheDocument();
  });

  test('allows starting at exactly the minimum duration of 10 seconds', () => {
    render(<PomodoroTimer taskName="Write report" />);
    fireEvent.click(screen.getByTestId('pomodoro-time'));
    fireEvent.change(screen.getByTestId('pomodoro-minutes-input'), {
      target: { value: '0' },
    });
    fireEvent.change(screen.getByTestId('pomodoro-seconds-input'), {
      target: { value: '10' },
    });
    fireEvent.keyDown(screen.getByTestId('pomodoro-seconds-input'), {
      key: 'Enter',
    });
    expect(screen.getByTestId('pomodoro-time')).toHaveTextContent('00:10');
    expect(screen.getByTestId('pomodoro-start')).not.toBeDisabled();

    fireEvent.click(screen.getByTestId('pomodoro-start'));
    expect(screen.getByText('pomodoro.pause')).toBeInTheDocument();
  });

  test('re-enables Start once the duration is edited back up to the minimum', () => {
    render(<PomodoroTimer taskName="Write report" />);
    fireEvent.click(screen.getByTestId('pomodoro-time'));
    fireEvent.change(screen.getByTestId('pomodoro-minutes-input'), {
      target: { value: '0' },
    });
    fireEvent.change(screen.getByTestId('pomodoro-seconds-input'), {
      target: { value: '3' },
    });
    fireEvent.keyDown(screen.getByTestId('pomodoro-seconds-input'), {
      key: 'Enter',
    });
    expect(screen.getByTestId('pomodoro-start')).toBeDisabled();

    fireEvent.click(screen.getByTestId('pomodoro-time'));
    fireEvent.change(screen.getByTestId('pomodoro-seconds-input'), {
      target: { value: '30' },
    });
    fireEvent.keyDown(screen.getByTestId('pomodoro-seconds-input'), {
      key: 'Enter',
    });
    expect(screen.getByTestId('pomodoro-start')).not.toBeDisabled();
  });

  test('plays a chime and shows an in-app banner when a phase completes without OS notifications', () => {
    render(<PomodoroTimer taskName="Write report" />);
    fireEvent.click(screen.getByText('pomodoro.start'));
    act(() => {
      jest.advanceTimersByTime(25 * 60 * 1000);
    });
    expect(playChime).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('pomodoro-banner')).toHaveTextContent(
      'pomodoro.notifyWorkDoneTitle'
    );
  });

  test('requests notification permission when starting if not yet decided', () => {
    (global as { Notification?: unknown }).Notification = MockNotification;
    render(<PomodoroTimer taskName="Write report" />);
    fireEvent.click(screen.getByText('pomodoro.start'));
    expect(MockNotification.requestPermission).toHaveBeenCalledTimes(1);
  });

  test('shows both an OS notification and the in-app banner when permission is granted', () => {
    MockNotification.permission = 'granted';
    (global as { Notification?: unknown }).Notification = MockNotification;
    render(<PomodoroTimer taskName="Write report" />);
    fireEvent.click(screen.getByText('pomodoro.start'));
    act(() => {
      jest.advanceTimersByTime(25 * 60 * 1000);
    });
    expect(MockNotification.instances).toHaveLength(1);
    expect(MockNotification.instances[0].title).toBe(
      'pomodoro.notifyWorkDoneTitle'
    );
    expect(screen.getByTestId('pomodoro-banner')).toBeInTheDocument();
  });

  test('dismisses the banner when its close button is clicked', () => {
    render(<PomodoroTimer taskName="Write report" />);
    fireEvent.click(screen.getByText('pomodoro.start'));
    act(() => {
      jest.advanceTimersByTime(25 * 60 * 1000);
    });
    fireEvent.click(screen.getByLabelText('pomodoro.dismiss'));
    expect(screen.queryByTestId('pomodoro-banner')).not.toBeInTheDocument();
  });

  test('auto-dismisses the banner after a delay', () => {
    render(<PomodoroTimer taskName="Write report" />);
    fireEvent.click(screen.getByText('pomodoro.start'));
    act(() => {
      jest.advanceTimersByTime(25 * 60 * 1000);
    });
    expect(screen.getByTestId('pomodoro-banner')).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(6000);
    });
    expect(screen.queryByTestId('pomodoro-banner')).not.toBeInTheDocument();
  });
});
