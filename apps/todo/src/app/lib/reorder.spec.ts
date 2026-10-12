import { TodoItem } from '@shared/types';
import { computeMove, sortByOrder } from './reorder';

function todo(id: string, order: number): TodoItem {
  return {
    id,
    name: id,
    status: 'pending',
    todolistId: 'list-1',
    order,
    priority: 'medium',
    source: 'web',
  };
}

function applyUpdates(
  items: TodoItem[],
  updates: ReturnType<typeof computeMove>
) {
  const orders = new Map(updates.map(({ id, order }) => [id, order]));
  return items.map((item) => ({
    ...item,
    order: orders.get(item.id) ?? item.order,
  }));
}

describe('reorder', () => {
  test('moves one position when siblings have duplicate default orders', () => {
    const items = [todo('a', 0), todo('b', 0), todo('c', 0)];

    // Ties show the newest task (highest id) first, so the list reads c, b, a.
    const updated = applyUpdates(items, computeMove(items, 'c', 'b'));

    expect(sortByOrder(updated).map(({ id }) => id)).toEqual(['b', 'c', 'a']);
    expect(sortByOrder(updated).map(({ order }) => order)).toEqual([0, 1, 2]);
  });

  test('puts the newest task first among tasks with the same order', () => {
    const items = [todo('a', 0), todo('c', 0), todo('b', 0)];

    expect(sortByOrder(items).map(({ id }) => id)).toEqual(['c', 'b', 'a']);
  });

  test('keeps an explicit order ahead of the newest-first tie break', () => {
    const items = [todo('a', 0), todo('b', 1), todo('c', 1)];

    expect(sortByOrder(items).map(({ id }) => id)).toEqual(['a', 'c', 'b']);
  });

  test('moves up and keeps normalized orders unique', () => {
    const items = [todo('a', 0), todo('b', 1), todo('c', 2)];

    const updated = applyUpdates(items, computeMove(items, 'c', 'b'));

    expect(sortByOrder(updated).map(({ id }) => id)).toEqual(['a', 'c', 'b']);
    expect(sortByOrder(updated).map(({ order }) => order)).toEqual([0, 1, 2]);
  });

  test('moves a task to the top of a longer list', () => {
    const items = [todo('a', 0), todo('b', 1), todo('c', 2), todo('d', 3)];

    const updated = applyUpdates(items, computeMove(items, 'd', 'a'));

    expect(sortByOrder(updated).map(({ id }) => id)).toEqual([
      'd',
      'a',
      'b',
      'c',
    ]);
  });

  test('does nothing for missing items or a task dropped on itself', () => {
    const items = [todo('a', 0), todo('b', 1)];

    expect(computeMove(items, 'missing', 'a')).toEqual([]);
    expect(computeMove(items, 'a', 'missing')).toEqual([]);
    expect(computeMove(items, 'a', 'a')).toEqual([]);
  });
});
