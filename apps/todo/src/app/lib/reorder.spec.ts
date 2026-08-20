import { TodoItem } from '@shared/types';
import { computeReorder, sortByOrder } from './reorder';

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
  updates: ReturnType<typeof computeReorder>
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

    const updated = applyUpdates(items, computeReorder(items, 'a', 'down'));

    expect(sortByOrder(updated).map(({ id }) => id)).toEqual(['b', 'a', 'c']);
    expect(sortByOrder(updated).map(({ order }) => order)).toEqual([0, 1, 2]);
  });

  test('moves up and keeps normalized orders unique', () => {
    const items = [todo('a', 0), todo('b', 1), todo('c', 2)];

    const updated = applyUpdates(items, computeReorder(items, 'c', 'up'));

    expect(sortByOrder(updated).map(({ id }) => id)).toEqual(['a', 'c', 'b']);
    expect(sortByOrder(updated).map(({ order }) => order)).toEqual([0, 1, 2]);
  });

  test('does nothing for missing items or list boundaries', () => {
    const items = [todo('a', 0), todo('b', 1)];

    expect(computeReorder(items, 'missing', 'down')).toEqual([]);
    expect(computeReorder(items, 'a', 'up')).toEqual([]);
    expect(computeReorder(items, 'b', 'down')).toEqual([]);
  });
});
