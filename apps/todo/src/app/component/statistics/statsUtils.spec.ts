import {
  computeCategoryData,
  computeStatusData,
  computeTimeSeries,
  computeWeekdayData,
  filterByPeriod,
  getDaysTracked,
} from './statsUtils';
import { TodoItem, TodoList } from '@shared/types';

const todo = (
  id: string,
  status: TodoItem['status'],
  date?: string
): TodoItem => ({
  id,
  name: id,
  status,
  todolistId: 'l',
  dueDate: date,
  completedAt: null,
  order: 0,
});
const list = (category: TodoList['category'], todos: TodoItem[]): TodoList => ({
  id: String(category),
  name: String(category),
  userId: 'u',
  category,
  todos,
});

describe('statistics utilities', () => {
  test('keeps undated todos in period filters', () =>
    expect(filterByPeriod([todo('a', 'pending')], 'week')).toHaveLength(1));
  test('filters old dated todos', () =>
    expect(
      filterByPeriod([todo('a', 'pending', '2020-01-01')], 'year')
    ).toHaveLength(0));
  test.each(['week', 'month', 'year'] as const)(
    'creates buckets for %s',
    (period) => {
      const result = computeTimeSeries([], period);
      expect(result.length).toBe(
        period === 'week' ? 7 : period === 'month' ? 4 : 12
      );
      expect(result.every((point) => point.total === 0)).toBe(true);
    }
  );
  test('counts statuses in a current time bucket', () => {
    const now = new Date().toISOString();
    const result = computeTimeSeries(
      [
        todo('a', 'successful', now),
        todo('b', 'failed', now),
        todo('c', 'pending', now),
      ],
      'week'
    );
    expect(result.reduce((n, p) => n + p.total, 0)).toBe(3);
    expect(result.reduce((n, p) => n + p.successful, 0)).toBe(1);
  });
  test('groups weekdays Monday through Sunday', () => {
    const result = computeWeekdayData([
      todo('a', 'successful', '2026-08-03T12:00:00Z'),
      todo('b', 'pending', '2026-08-09T12:00:00Z'),
    ]);
    expect(result.map((p) => p.day)).toEqual([
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Sun',
    ]);
    expect(result[0]).toMatchObject({ total: 1, successful: 1 });
    expect(result[6].total).toBe(1);
  });
  test('returns only non-zero status series', () =>
    expect(
      computeStatusData([todo('a', 'successful'), todo('b', 'successful')])
    ).toEqual([{ name: 'Done', value: 2, color: '#DCF763' }]));
  test('returns empty status series for no todos', () =>
    expect(computeStatusData([])).toEqual([]));
  test('groups categories and successful counts', () =>
    expect(
      computeCategoryData([
        list('work', [todo('a', 'successful'), todo('b', 'pending')]),
        list('home', [todo('c', 'failed')]),
      ])
    ).toEqual([
      { name: 'Home', total: 1, successful: 0 },
      { name: 'Work', total: 2, successful: 1 },
    ]));
  test('omits empty categories', () =>
    expect(computeCategoryData([list('work', [])])).toEqual([]));
  test('calculates tracked days and handles no dates', () => {
    expect(getDaysTracked([list('work', [todo('a', 'pending')])])).toBe(0);
    expect(
      getDaysTracked([
        list('work', [
          todo('a', 'pending', new Date(Date.now() - 86400000).toISOString()),
        ]),
      ])
    ).toBe(2);
  });
});
