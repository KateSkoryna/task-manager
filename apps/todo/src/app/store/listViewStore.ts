import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TodoList } from '@shared/types';
import { FlatSort } from '../lib/sortTasks';

export type TasksViewMode = 'flat' | 'archived';

interface ListViewState {
  /** Only lists the user has toggled; the rest use the default below. */
  expandedByList: Record<string, boolean>;
  tasksViewMode: TasksViewMode;
  vitalFlatSort: FlatSort;
  setListExpanded: (listId: string, expanded: boolean) => void;
  setListsExpanded: (listIds: string[], expanded: boolean) => void;
  setTasksViewMode: (mode: TasksViewMode) => void;
  setVitalFlatSort: (sort: FlatSort) => void;
}

export const initialListViewState = {
  expandedByList: {} as Record<string, boolean>,
  tasksViewMode: 'flat' as TasksViewMode,
  vitalFlatSort: 'dueDate' as FlatSort,
};

/**
 * Remembers how the user arranged their lists (collapsed lists, sort order,
 * view mode) across page switches and reloads. Saved in this browser's
 * localStorage on purpose: it is a view preference, not data.
 */
export const useListViewStore = create<ListViewState>()(
  persist(
    (set) => ({
      ...initialListViewState,
      setListExpanded: (listId, expanded) =>
        set((state) => ({
          expandedByList: { ...state.expandedByList, [listId]: expanded },
        })),
      setListsExpanded: (listIds, expanded) =>
        set((state) => ({
          expandedByList: {
            ...state.expandedByList,
            ...Object.fromEntries(listIds.map((id) => [id, expanded])),
          },
        })),
      setTasksViewMode: (tasksViewMode) => set({ tasksViewMode }),
      setVitalFlatSort: (vitalFlatSort) => set({ vitalFlatSort }),
    }),
    {
      name: 'todo-list-view',
      version: 2,
      // Grouped view was removed; anyone who saved it lands on flat.
      migrate: (persisted) => ({
        ...(persisted as Partial<ListViewState>),
        tasksViewMode: 'flat',
      }),
    }
  )
);

/** A list nobody toggled yet starts expanded only if it has tasks. */
export const isListExpanded = (
  expandedByList: Record<string, boolean>,
  list: Pick<TodoList, 'id' | 'todos'>
) => expandedByList[list.id] ?? list.todos.length > 0;
