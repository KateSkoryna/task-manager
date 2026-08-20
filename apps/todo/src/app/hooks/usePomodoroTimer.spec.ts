import { act, renderHook } from '@testing-library/react';
import {
  usePomodoroTimer,
  WORK_SECONDS,
  BREAK_SECONDS,
} from './usePomodoroTimer';

describe('usePomodoroTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('starts idle in the work phase with the full work duration', () => {
    const { result } = renderHook(() => usePomodoroTimer());
    expect(result.current.status).toBe('idle');
    expect(result.current.phase).toBe('work');
    expect(result.current.secondsLeft).toBe(WORK_SECONDS);
  });

  test('counts down once started', () => {
    const { result } = renderHook(() => usePomodoroTimer());
    act(() => result.current.start());
    act(() => jest.advanceTimersByTime(3000));
    expect(result.current.status).toBe('running');
    expect(result.current.secondsLeft).toBe(WORK_SECONDS - 3);
  });

  test('pause stops the countdown', () => {
    const { result } = renderHook(() => usePomodoroTimer());
    act(() => result.current.start());
    act(() => jest.advanceTimersByTime(2000));
    act(() => result.current.pause());
    const secondsAtPause = result.current.secondsLeft;
    act(() => jest.advanceTimersByTime(5000));
    expect(result.current.status).toBe('paused');
    expect(result.current.secondsLeft).toBe(secondsAtPause);
  });

  test('reset returns to idle work phase with full duration', () => {
    const { result } = renderHook(() => usePomodoroTimer());
    act(() => result.current.start());
    act(() => jest.advanceTimersByTime(5000));
    act(() => result.current.reset());
    expect(result.current.status).toBe('idle');
    expect(result.current.phase).toBe('work');
    expect(result.current.secondsLeft).toBe(WORK_SECONDS);
  });

  test('switches to break when the work phase completes and calls the callback exactly once', () => {
    const onPhaseComplete = jest.fn();
    const { result } = renderHook(() =>
      usePomodoroTimer(WORK_SECONDS, onPhaseComplete)
    );
    act(() => result.current.start());
    act(() => jest.advanceTimersByTime(WORK_SECONDS * 1000));
    expect(result.current.phase).toBe('break');
    expect(result.current.status).toBe('running');
    expect(result.current.secondsLeft).toBe(BREAK_SECONDS);
    expect(onPhaseComplete).toHaveBeenCalledTimes(1);
    expect(onPhaseComplete).toHaveBeenCalledWith('work');
  });

  test('switches back to work when the break phase completes', () => {
    const onPhaseComplete = jest.fn();
    const { result } = renderHook(() =>
      usePomodoroTimer(WORK_SECONDS, onPhaseComplete)
    );
    act(() => result.current.start());
    act(() => jest.advanceTimersByTime(WORK_SECONDS * 1000));
    act(() => jest.advanceTimersByTime(BREAK_SECONDS * 1000));
    expect(result.current.phase).toBe('work');
    expect(result.current.secondsLeft).toBe(WORK_SECONDS);
    expect(onPhaseComplete).toHaveBeenCalledTimes(2);
    expect(onPhaseComplete).toHaveBeenNthCalledWith(2, 'break');
  });

  test('uses a custom work duration when provided', () => {
    const { result } = renderHook(() => usePomodoroTimer(10 * 60 + 30));
    expect(result.current.secondsLeft).toBe(10 * 60 + 30);
  });

  test('updates the idle countdown when the work duration changes', () => {
    const { result, rerender } = renderHook(
      ({ seconds }) => usePomodoroTimer(seconds),
      { initialProps: { seconds: 25 * 60 } }
    );
    expect(result.current.secondsLeft).toBe(25 * 60);
    rerender({ seconds: 15 * 60 + 15 });
    expect(result.current.secondsLeft).toBe(15 * 60 + 15);
  });

  test('does not change the running countdown when the work duration input changes', () => {
    const { result, rerender } = renderHook(
      ({ seconds }) => usePomodoroTimer(seconds),
      { initialProps: { seconds: 25 * 60 } }
    );
    act(() => result.current.start());
    act(() => jest.advanceTimersByTime(3000));
    const secondsBefore = result.current.secondsLeft;
    rerender({ seconds: 15 * 60 });
    expect(result.current.secondsLeft).toBe(secondsBefore);
  });
});
