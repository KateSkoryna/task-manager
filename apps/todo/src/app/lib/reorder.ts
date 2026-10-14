import { TodoItem } from '@shared/types';

export function sortByOrder<T extends { order: number; id: string }>(
  items: T[]
): T[] {
  return [...items].sort(
    (a, b) => a.order - b.order || b.id.localeCompare(a.id)
  );
}

/**
 * Moves a todo to the position of another one and returns every changed
 * order to persist.
 */
export function computeMove(
  items: TodoItem[],
  activeId: string,
  overId: string
): { id: string; order: number }[] {
  const sorted = sortByOrder(items);
  const from = sorted.findIndex((item) => item.id === activeId);
  const to = sorted.findIndex((item) => item.id === overId);
  if (from === -1 || to === -1 || from === to) return [];

  const reordered = [...sorted];
  const [moved] = reordered.splice(from, 1);
  reordered.splice(to, 0, moved);

  return reordered.flatMap((item, order) =>
    item.order === order ? [] : [{ id: item.id, order }]
  );
}
