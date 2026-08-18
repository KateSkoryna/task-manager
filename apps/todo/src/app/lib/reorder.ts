import { TodoItem } from '@shared/types';

export function sortByOrder<T extends { order: number; id: string }>(
  items: T[]
): T[] {
  return [...items].sort(
    (a, b) => a.order - b.order || a.id.localeCompare(b.id)
  );
}

/** Moves a todo by one position and returns every changed order to persist. */
export function computeReorder(
  items: TodoItem[],
  id: string,
  direction: 'up' | 'down'
): { id: string; order: number }[] {
  const sorted = sortByOrder(items);
  const index = sorted.findIndex((item) => item.id === id);
  if (index === -1) return [];

  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= sorted.length) return [];

  const reordered = [...sorted];
  const [moved] = reordered.splice(index, 1);
  reordered.splice(swapIndex, 0, moved);

  return reordered.flatMap((item, order) =>
    item.order === order ? [] : [{ id: item.id, order }]
  );
}
