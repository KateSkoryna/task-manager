import { TodoListCategory } from '@shared/types';

/**
 * Empty lists every user starts with, one per category. They are flagged
 * `isDefault`, which locks their names.
 */
export const DEFAULT_LISTS: { name: string; category: TodoListCategory }[] = [
  { name: 'Home', category: 'home' },
  { name: 'Education', category: 'education' },
  { name: 'Work', category: 'work' },
  { name: 'Family', category: 'family' },
  { name: 'Health', category: 'health' },
];
