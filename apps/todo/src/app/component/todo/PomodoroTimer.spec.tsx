import { act, fireEvent, render, screen } from '@testing-library/react';
import PomodoroTimer from './PomodoroTimer';

describe('PomodoroTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
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

  test('clamps an edited duration below one minute up to one minute', () => {
    render(<PomodoroTimer taskName="Write report" />);
    fireEvent.click(screen.getByTestId('pomodoro-time'));
    fireEvent.change(screen.getByTestId('pomodoro-minutes-input'), {
      target: { value: '0' },
    });
    fireEvent.change(screen.getByTestId('pomodoro-seconds-input'), {
      target: { value: '0' },
    });
    fireEvent.keyDown(screen.getByTestId('pomodoro-seconds-input'), {
      key: 'Enter',
    });
    expect(screen.getByTestId('pomodoro-time')).toHaveTextContent('01:00');
  });
});
