import { TodoItem, TodoList } from '@shared/types';
import { sortFlatEntries, sortLists } from './sortTasks';

const todo = (over: Partial<TodoItem>): TodoItem => ({
  id: over.name ?? 'x',
  name: 'x',
  status: 'pending',
  todolistId: null,
  order: 0,
  priority: 'medium',
  source: 'web',
  ...over,
});
const entry = (over: Partial<TodoItem>) => ({
  todo: todo(over),
  listId: over.todolistId ?? null,
});
const names = (entries: { todo: TodoItem }[]) =>
  entries.map((e) => e.todo.name);

const list = (over: Partial<TodoList>): TodoList => ({
  id: over.name ?? 'l',
  name: 'l',
  userId: 'u',
  todos: [],
  ...over,
});

describe('sortFlatEntries', () => {
  const listNames = new Map([
    ['l1', 'Work'],
    ['l2', 'Home'],
  ]);

  it('sorts by due date, soonest first, undated last', () => {
    const result = sortFlatEntries(
      [
        entry({ name: 'none' }),
        entry({ name: 'late', dueDate: '2026-12-01' }),
        entry({ name: 'soon', dueDate: '2026-10-01' }),
      ],
      'dueDate',
      listNames
    );
    expect(names(result)).toEqual(['soon', 'late', 'none']);
  });

  it('sorts by name', () => {
    const result = sortFlatEntries(
      [entry({ name: 'b' }), entry({ name: 'a' })],
      'name',
      listNames
    );
    expect(names(result)).toEqual(['a', 'b']);
  });

  it('sorts by list name with inbox tasks last', () => {
    const result = sortFlatEntries(
      [
        entry({ name: 'inbox' }),
        entry({ name: 'work', todolistId: 'l1' }),
        entry({ name: 'home', todolistId: 'l2' }),
      ],
      'listName',
      listNames
    );
    expect(names(result)).toEqual(['home', 'work', 'inbox']);
  });

  it('sorts by priority, high first', () => {
    const result = sortFlatEntries(
      [
        entry({ name: 'low', priority: 'low' }),
        entry({ name: 'high', priority: 'high' }),
        entry({ name: 'medium', priority: 'medium' }),
      ],
      'priority',
      listNames
    );
    expect(names(result)).toEqual(['high', 'medium', 'low']);
  });

  it('sorts by status, pending first', () => {
    const result = sortFlatEntries(
      [
        entry({ name: 'done', status: 'successful' }),
        entry({ name: 'open', status: 'pending' }),
      ],
      'status',
      listNames
    );
    expect(names(result)).toEqual(['open', 'done']);
  });

  it('breaks ties by due date, then name', () => {
    const result = sortFlatEntries(
      [
        entry({ name: 'b', priority: 'high', dueDate: '2026-10-02' }),
        entry({ name: 'c', priority: 'high', dueDate: '2026-10-01' }),
        entry({ name: 'a', priority: 'high', dueDate: '2026-10-02' }),
      ],
      'priority',
      listNames
    );
    expect(names(result)).toEqual(['c', 'a', 'b']);
  });
});

describe('sortLists', () => {
  const lists = [
    list({ name: 'Work', priority: 'low', dueDate: '2026-12-01' }),
    list({ name: 'Home', priority: 'high' }),
    list({ name: 'Health', priority: 'medium', dueDate: '2026-10-01' }),
  ];
  const listNames = (l: TodoList[]) => l.map((x) => x.name);

  it('keeps the incoming order for created', () => {
    expect(sortLists(lists, 'created')).toBe(lists);
  });

  it('sorts by name', () => {
    expect(listNames(sortLists(lists, 'name'))).toEqual([
      'Health',
      'Home',
      'Work',
    ]);
  });

  it('sorts by due date with undated lists last', () => {
    expect(listNames(sortLists(lists, 'dueDate'))).toEqual([
      'Health',
      'Work',
      'Home',
    ]);
  });

  it('sorts by priority, high first', () => {
    expect(listNames(sortLists(lists, 'priority'))).toEqual([
      'Home',
      'Health',
      'Work',
    ]);
  });

  it('does not mutate the input', () => {
    const before = listNames(lists);
    sortLists(lists, 'name');
    expect(listNames(lists)).toEqual(before);
  });
});
