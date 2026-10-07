import { TodoList } from '@shared/types';
import { FlatEntry } from '../component/todo/FlatTaskList';

export type FlatSort = 'dueDate' | 'name' | 'listName' | 'priority' | 'status';
export type ListSort = 'created' | 'name' | 'dueDate' | 'priority';

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 } as const;
const STATUS_RANK = { pending: 0, successful: 1, failed: 2 } as const;
const LAST = Number.MAX_SAFE_INTEGER;

// A missing value always sorts after a present one.
function compareNullable<T>(
  a: T | null | undefined,
  b: T | null | undefined,
  compare: (x: T, y: T) => number
) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return compare(a, b);
}

const compareText = (a: string, b: string) => a.localeCompare(b);
const compareDates = (a?: string | null, b?: string | null) =>
  compareNullable(a, b, compareText);
const rank = (table: Record<string, number>, key?: string) =>
  key === undefined ? LAST : table[key] ?? LAST;

const flatComparators: Record<
  FlatSort,
  (a: FlatEntry, b: FlatEntry, listNames: Map<string, string>) => number
> = {
  dueDate: (a, b) => compareDates(a.todo.dueDate, b.todo.dueDate),
  name: (a, b) => compareText(a.todo.name, b.todo.name),
  listName: (a, b, listNames) =>
    compareNullable(
      a.listId ? listNames.get(a.listId) : null,
      b.listId ? listNames.get(b.listId) : null,
      compareText
    ),
  priority: (a, b) =>
    rank(PRIORITY_RANK, a.todo.priority) - rank(PRIORITY_RANK, b.todo.priority),
  status: (a, b) =>
    rank(STATUS_RANK, a.todo.status) - rank(STATUS_RANK, b.todo.status),
};

/** Sorts tasks by the chosen field; ties fall back to due date, then name. */
export function sortFlatEntries(
  entries: FlatEntry[],
  sort: FlatSort,
  listNames: Map<string, string>
): FlatEntry[] {
  return [...entries].sort(
    (a, b) =>
      flatComparators[sort](a, b, listNames) ||
      compareDates(a.todo.dueDate, b.todo.dueDate) ||
      compareText(a.todo.name, b.todo.name)
  );
}

const listComparators: Record<
  Exclude<ListSort, 'created'>,
  (a: TodoList, b: TodoList) => number
> = {
  name: (a, b) => compareText(a.name, b.name),
  dueDate: (a, b) => compareDates(a.dueDate, b.dueDate),
  priority: (a, b) =>
    rank(PRIORITY_RANK, a.priority) - rank(PRIORITY_RANK, b.priority),
};

/** Sorts lists by the chosen field; `created` keeps the incoming order. */
export function sortLists(lists: TodoList[], sort: ListSort): TodoList[] {
  if (sort === 'created') return lists;
  const compare = listComparators[sort];
  return [...lists].sort(
    (a, b) => compare(a, b) || compareText(a.name, b.name)
  );
}
