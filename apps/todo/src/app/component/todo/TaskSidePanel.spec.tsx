import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoItem, TodoList } from '@shared/types';
import { TodoEditPanel } from './TaskSidePanel';

jest.mock('../../lib/imageUtils', () => ({ uploadImage: jest.fn() }));
jest.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (state: { user: null }) => unknown) =>
    selector({ user: null }),
}));

const todo: TodoItem = {
  id: 'todo-1',
  name: 'Write tests',
  status: 'pending',
  order: 0,
  todolistId: 'list-1',
};

const list: TodoList = {
  id: 'list-1',
  name: 'Engineering',
  userId: 'user-1',
  todos: [todo],
  priority: 'low',
  category: 'home',
};

describe('TodoEditPanel dropdowns', () => {
  test('renders all metadata fields as named native disclosures', async () => {
    render(
      <TodoEditPanel
        todo={todo}
        list={list}
        onSave={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const summaries = [
      screen.getByLabelText('tasks.status'),
      screen.getByLabelText('tasks.priority'),
      screen.getByLabelText('tasks.category'),
    ];
    summaries.forEach((summary) => {
      expect(summary.tagName).toBe('SUMMARY');
      expect(summary.closest('details')?.firstElementChild).toBe(summary);
    });
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(document.querySelector('select')).not.toBeInTheDocument();

    await userEvent.click(summaries[0]);
    const statusButtons = within(
      summaries[0].closest('details') as HTMLElement
    ).getAllByRole('button');
    expect(statusButtons).toHaveLength(3);
    expect(
      within(summaries[0].closest('details') as HTMLElement).queryByRole(
        'button',
        { name: 'tasks.priority_none' }
      )
    ).not.toBeInTheDocument();
  });

  test('saves keyboard and mouse selections and clears an optional field', async () => {
    const onSave = jest.fn();
    const user = userEvent.setup();
    render(
      <TodoEditPanel
        todo={todo}
        list={list}
        onSave={onSave}
        onCancel={jest.fn()}
      />
    );

    const status = screen.getByLabelText('tasks.status');
    await user.click(status);
    within(status.closest('details') as HTMLElement)
      .getByRole('button', { name: 'tasks.status_successful' })
      .focus();
    await user.keyboard('{Enter}');

    const priority = screen.getByLabelText('tasks.priority');
    await user.click(priority);
    await user.click(
      within(priority.closest('details') as HTMLElement).getByRole('button', {
        name: 'tasks.priority_high',
      })
    );

    const category = screen.getByLabelText('tasks.category');
    await user.click(category);
    await user.click(
      within(category.closest('details') as HTMLElement).getByRole('button', {
        name: 'tasks.category_work',
      })
    );
    await user.click(category);
    await user.click(
      within(category.closest('details') as HTMLElement).getByRole('button', {
        name: 'tasks.category_none',
      })
    );

    await user.click(screen.getByTestId('save-todo-edit-button-todo-1'));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0]).toEqual(
      expect.objectContaining({ name: 'Write tests', status: 'successful' })
    );
    expect(onSave.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        name: 'Engineering',
        priority: 'high',
        category: undefined,
      })
    );
  });
});
