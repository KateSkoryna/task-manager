import { fireEvent, render, screen } from '@testing-library/react';
import VitalTaskHero, { VitalTodoEntry } from './VitalTaskHero';
import { TodoItem, TodoList } from '@shared/types';

const makeList = (extra: Partial<TodoList> = {}): TodoList => ({
  id: 'l1',
  name: 'Launch product',
  userId: 'u1',
  priority: 'high',
  todos: [],
  ...extra,
});

const makeTodo = (id: string, extra: Partial<TodoItem> = {}): TodoItem => ({
  id,
  name: `Task ${id}`,
  status: 'pending',
  todolistId: 'l1',
  order: 0,
  ...extra,
});

const makeEntries = (count: number): VitalTodoEntry[] => {
  const list = makeList();
  return Array.from({ length: count }, (_, i) => ({
    todo: makeTodo(String(i + 1)),
    list,
  }));
};

describe('VitalTaskHero', () => {
  test('renders nothing when there are no entries', () => {
    const { container } = render(
      <VitalTaskHero
        entries={[]}
        totalVitalCount={0}
        onSelect={jest.fn()}
        onToggleComplete={jest.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test('renders a card per entry with its goal label', () => {
    render(
      <VitalTaskHero
        entries={makeEntries(3)}
        totalVitalCount={3}
        onSelect={jest.fn()}
        onToggleComplete={jest.fn()}
      />
    );
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('Task 3')).toBeInTheDocument();
    expect(screen.getAllByText('vitalTask.goalLabel')).toHaveLength(3);
  });

  test('hides the focus warning at or below five vital tasks', () => {
    render(
      <VitalTaskHero
        entries={makeEntries(3)}
        totalVitalCount={5}
        onSelect={jest.fn()}
        onToggleComplete={jest.fn()}
      />
    );
    expect(screen.queryByTestId('vital-focus-warning')).not.toBeInTheDocument();
  });

  test('shows a gentle focus warning above five vital tasks', () => {
    render(
      <VitalTaskHero
        entries={makeEntries(3)}
        totalVitalCount={6}
        onSelect={jest.fn()}
        onToggleComplete={jest.fn()}
      />
    );
    expect(screen.getByTestId('vital-focus-warning')).toBeInTheDocument();
  });

  test('selects a card by click and Enter', () => {
    const onSelect = jest.fn();
    const entries = makeEntries(1);
    render(
      <VitalTaskHero
        entries={entries}
        totalVitalCount={1}
        onSelect={onSelect}
        onToggleComplete={jest.fn()}
      />
    );
    const card = screen.getByTestId('vital-task-card-1');
    fireEvent.click(card);
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(onSelect).toHaveBeenCalledWith(entries[0].todo, entries[0].list);
  });

  test('marks a task done without triggering select', () => {
    const onSelect = jest.fn();
    const onToggleComplete = jest.fn();
    render(
      <VitalTaskHero
        entries={makeEntries(1)}
        totalVitalCount={1}
        onSelect={onSelect}
        onToggleComplete={onToggleComplete}
      />
    );
    fireEvent.click(screen.getByText('vitalTask.markDone'));
    expect(onToggleComplete).toHaveBeenCalledWith('1');
    expect(onSelect).not.toHaveBeenCalled();
  });
});
