import { average, median, round1 } from './statsMath';

describe('average', () => {
  it('averages a list of numbers', () => {
    expect(average([1, 2, 3])).toBe(2);
  });

  it('is null for an empty list', () => {
    expect(average([])).toBeNull();
  });
});

describe('median', () => {
  it('is the middle value for an odd-length list', () => {
    expect(median([5, 1, 3])).toBe(3);
  });

  it('averages the two middle values for an even-length list', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it('is null for an empty list', () => {
    expect(median([])).toBeNull();
  });

  it('is not skewed by an outlier the way a mean would be', () => {
    expect(median([1, 2, 3, 100])).toBe(2.5);
    expect(average([1, 2, 3, 100])).toBe(26.5);
  });
});

describe('round1', () => {
  it('rounds to one decimal place', () => {
    expect(round1(1.25)).toBe(1.3);
    expect(round1(1.24)).toBe(1.2);
  });
});
