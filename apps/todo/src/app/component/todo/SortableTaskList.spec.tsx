import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SortableTaskList from './SortableTaskList';
import TodoItem from './TodoItem';

const todo = (id: string) => ({
  id,
  name: 'Task ' + id,
  status: 'pending' as const,
  todolistId: null,
  order: 0,
  priority: 'medium' as const,
  source: 'web' as const,
});

test('Enter and Space on the title open the task inside the sortable list', async () => {
  const select = jest.fn();
  render(
    <SortableTaskList
      items={[todo('1'), todo('2')]}
      onReorder={jest.fn()}
      renderItem={(t) => <TodoItem todo={t} onSelect={() => select(t.id)} />}
    />
  );
  await userEvent.tab();
  expect(screen.getByRole('button', { name: 'Task 1' })).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  expect(select).toHaveBeenCalledTimes(1);
  await userEvent.keyboard(' ');
  expect(select).toHaveBeenCalledTimes(2);
});
