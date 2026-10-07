import { act, renderHook } from '@testing-library/react';
import { advanceAngle, clockAngles, useClockAngles } from './useClockAngles';

describe('clockAngles', () => {
  it('reads the time in the given timezone', () => {
    const date = new Date('2026-10-07T13:30:15.000Z');
    // 15:30:15 in Berlin (UTC+2 in October).
    expect(clockAngles(date, 'Europe/Berlin')).toEqual({
      hour: 3 * 30 + 15,
      minute: 30 * 6 + 1.5,
      second: 90,
    });
    // 13:30:15 in UTC.
    expect(clockAngles(date, 'UTC').hour).toBe(1 * 30 + 15);
  });

  it('puts midnight and noon at the top', () => {
    expect(clockAngles(new Date('2026-10-07T00:00:00.000Z'), 'UTC')).toEqual({
      hour: 0,
      minute: 0,
      second: 0,
    });
    expect(clockAngles(new Date('2026-10-07T12:00:00.000Z'), 'UTC').hour).toBe(
      0
    );
  });
});

describe('advanceAngle', () => {
  it('keeps turning clockwise past the top instead of spinning back', () => {
    expect(advanceAngle(354, 0)).toBe(360);
    expect(advanceAngle(360, 6)).toBe(366);
    expect(advanceAngle(90, 96)).toBe(96);
    expect(advanceAngle(90, 90)).toBe(90);
  });
});

describe('useClockAngles', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-07T10:00:58.000Z'));
  });
  afterEach(() => jest.useRealTimers());

  it('ticks every second and carries on past the minute', () => {
    const { result } = renderHook(() => useClockAngles('UTC'));
    expect(result.current.second).toBe(58 * 6);

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    // 10:01:01, one second into the next turn.
    expect(result.current.second).toBe(360 + 6);
  });
});
