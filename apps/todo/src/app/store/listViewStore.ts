import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TodoList } from '@shared/types';
import { FlatSort, ListSort } from '../lib/sortTasks';

export type TasksViewMode = 'grouped' | 'flat';

interface ListViewState {
  /** Only lists the user has toggled; the rest use the default below. */
  expandedByList: Record<string, boolean>;
  tasksViewMode: TasksViewMode;
  tasksFlatSort: FlatSort;
  tasksListSort: ListSort;
  vitalListSort: ListSort;
  setListExpanded: (listId: string, expanded: boolean) => void;
  setListsExpanded: (listIds: string[], expanded: boolean) => void;
  setTasksViewMode: (mode: TasksViewMode) => void;
  setTasksFlatSort: (sort: FlatSort) => void;
  setTasksListSort: (sort: ListSort) => void;
  setVitalListSort: (sort: ListSort) => void;
}

export const initialListViewState = {
  expandedByList: {} as Record<string, boolean>,
  tasksViewMode: 'grouped' as TasksViewMode,
  tasksFlatSort: 'dueDate' as FlatSort,
  tasksListSort: 'name' as ListSort,
  vitalListSort: 'name' as ListSort,
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
      setTasksFlatSort: (tasksFlatSort) => set({ tasksFlatSort }),
      setTasksListSort: (tasksListSort) => set({ tasksListSort }),
      setVitalListSort: (vitalListSort) => set({ vitalListSort }),
    }),
    { name: 'todo-list-view', version: 1 }
  )
);

/** A list nobody toggled yet starts expanded only if it has tasks. */
export const isListExpanded = (
  expandedByList: Record<string, boolean>,
  list: Pick<TodoList, 'id' | 'todos'>
) => expandedByList[list.id] ?? list.todos.length > 0;
