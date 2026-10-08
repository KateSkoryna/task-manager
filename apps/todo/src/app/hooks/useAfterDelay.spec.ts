import { act, renderHook } from '@testing-library/react';
import { useAfterDelay } from './useAfterDelay';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('useAfterDelay', () => {
  it('turns true only after the delay has passed', () => {
    const { result } = renderHook(() => useAfterDelay(true, 4000));

    expect(result.current).toBe(false);
    act(() => jest.advanceTimersByTime(3999));
    expect(result.current).toBe(false);
    act(() => jest.advanceTimersByTime(1));
    expect(result.current).toBe(true);
  });

  it('never turns true if the wait ends first', () => {
    const { result, rerender } = renderHook(
      ({ active }) => useAfterDelay(active, 4000),
      { initialProps: { active: true } }
    );

    act(() => jest.advanceTimersByTime(2000));
    rerender({ active: false });
    act(() => jest.advanceTimersByTime(10000));

    expect(result.current).toBe(false);
  });

  it('resets when the wait ends after it was true', () => {
    const { result, rerender } = renderHook(
      ({ active }) => useAfterDelay(active, 1000),
      { initialProps: { active: true } }
    );
    act(() => jest.advanceTimersByTime(1000));
    expect(result.current).toBe(true);

    rerender({ active: false });

    expect(result.current).toBe(false);
  });
});
