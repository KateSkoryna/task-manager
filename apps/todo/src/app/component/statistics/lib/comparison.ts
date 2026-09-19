export const MIN_TASKS_FOR_COMPARISON = 5;

export interface Comparison {
  /** Percentage points for a rate, absolute units for a count/average. */
  delta: number;
  previousValue: number;
}

/**
 * Compares a current metric value against its previous-period value. Returns
 * null (no comparison shown) when either value is unavailable or the
 * previous span didn't have enough due tasks to be meaningful — a
 * comparison without enough data misleads more than no comparison.
 */
export function compareValues(
  currentValue: number | null,
  previousValue: number | null,
  previousSampleSize: number
): Comparison | null {
  if (currentValue === null || previousValue === null) return null;
  if (previousSampleSize < MIN_TASKS_FOR_COMPARISON) return null;
  return {
    delta: Math.round((currentValue - previousValue) * 10) / 10,
    previousValue,
  };
}
