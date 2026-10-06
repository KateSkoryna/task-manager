import {
  initialListViewState,
  isListExpanded,
  useListViewStore,
} from './listViewStore';

describe('listViewStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useListViewStore.setState(initialListViewState);
  });

  it('saves the layout to localStorage and restores it', async () => {
    useListViewStore.getState().setListExpanded('l1', false);
    useListViewStore.getState().setTasksViewMode('flat');

    const raw = localStorage.getItem('todo-list-view') ?? '{}';
    const saved = JSON.parse(raw);
    expect(saved.state.expandedByList).toEqual({ l1: false });
    expect(saved.state.tasksViewMode).toBe('flat');

    // Simulate a fresh page load: memory starts empty, storage still has the
    // saved layout (resetting the store also overwrites it, so put it back).
    useListViewStore.setState(initialListViewState);
    localStorage.setItem('todo-list-view', raw);
    expect(useListViewStore.getState().tasksViewMode).toBe('grouped');
    await useListViewStore.persist.rehydrate();
    expect(useListViewStore.getState().tasksViewMode).toBe('flat');
    expect(useListViewStore.getState().expandedByList).toEqual({ l1: false });
  });

  it('sets many lists at once', () => {
    useListViewStore.getState().setListsExpanded(['a', 'b'], false);
    expect(useListViewStore.getState().expandedByList).toEqual({
      a: false,
      b: false,
    });
  });

  it('defaults to expanded only for lists that have tasks', () => {
    const task = { id: 't' } as never;
    expect(isListExpanded({}, { id: 'x', todos: [task] })).toBe(true);
    expect(isListExpanded({}, { id: 'x', todos: [] })).toBe(false);
    expect(isListExpanded({ x: false }, { id: 'x', todos: [task] })).toBe(
      false
    );
  });
});
