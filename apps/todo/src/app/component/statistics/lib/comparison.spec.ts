import { compareValues, MIN_TASKS_FOR_COMPARISON } from './comparison';

describe('compareValues', () => {
  it('returns a percentage-point delta when there is enough previous data', () => {
    const result = compareValues(68, 60, MIN_TASKS_FOR_COMPARISON);
    expect(result).toEqual({ delta: 8, previousValue: 60 });
  });

  it('returns null when the current value is unavailable', () => {
    expect(compareValues(null, 60, 10)).toBeNull();
  });

  it('returns null when the previous value is unavailable', () => {
    expect(compareValues(68, null, 10)).toBeNull();
  });

  it('returns null when the previous span has too little data to be meaningful', () => {
    expect(compareValues(68, 60, MIN_TASKS_FOR_COMPARISON - 1)).toBeNull();
  });

  it('allows a negative delta', () => {
    const result = compareValues(50, 60, MIN_TASKS_FOR_COMPARISON);
    expect(result?.delta).toBe(-10);
  });
});
