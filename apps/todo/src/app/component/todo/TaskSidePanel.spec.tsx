import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoItem, TodoList } from '@shared/types';
import { TaskDetailPanel, TodoEditPanel } from './TaskSidePanel';

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
  priority: 'medium',
  source: 'web',
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
      screen.getByLabelText('tasks.taskPriority'),
      screen.getByLabelText('tasks.listPriority'),
      screen.getByLabelText('tasks.category'),
    ];
    summaries.forEach((summary) => {
      expect(summary.tagName).toBe('SUMMARY');
      expect(summary.closest('details')?.firstElementChild).toBe(summary);
    });
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(document.querySelector('select')).not.toBeInTheDocument();

    // The options render on the `toggle` event, which fires after the click
    // has resolved, so wait for them instead of querying straight away.
    await userEvent.click(summaries[0]);
    const statusButtons = await within(
      summaries[0].closest('details') as HTMLElement
    ).findAllByRole('button');
    expect(statusButtons).toHaveLength(3);
    expect(
      within(summaries[0].closest('details') as HTMLElement).queryByRole(
        'button',
        { name: 'tasks.priority_none' }
      )
    ).not.toBeInTheDocument();
  });

  // Nine user interactions in a row. It takes well under a second alone, but
  // has exceeded Jest's 5s default when the whole suite runs in parallel on a
  // busy machine, so it gets a longer budget.
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
    (
      await within(status.closest('details') as HTMLElement).findByRole(
        'button',
        { name: 'tasks.status_successful' }
      )
    ).focus();
    await user.keyboard('{Enter}');

    const priority = screen.getByLabelText('tasks.listPriority');
    await user.click(priority);
    await user.click(
      await within(priority.closest('details') as HTMLElement).findByRole(
        'button',
        { name: 'tasks.priority_high' }
      )
    );

    const category = screen.getByLabelText('tasks.category');
    await user.click(category);
    await user.click(
      await within(category.closest('details') as HTMLElement).findByRole(
        'button',
        { name: 'tasks.category_work' }
      )
    );
    await user.click(category);
    await user.click(
      await within(category.closest('details') as HTMLElement).findByRole(
        'button',
        { name: 'tasks.category_none' }
      )
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
  }, 15000);
});

describe('TodoEditPanel default lists', () => {
  test('locks the list name for a default list but keeps it for others', () => {
    const { rerender } = render(
      <TodoEditPanel
        todo={todo}
        list={{ ...list, isDefault: true }}
        onSave={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.getByDisplayValue(list.name)).toHaveAttribute('readonly');
    expect(
      screen.getByTestId('edit-todo-default-list-note')
    ).toBeInTheDocument();

    rerender(
      <TodoEditPanel
        todo={todo}
        list={list}
        onSave={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.getByDisplayValue(list.name)).not.toHaveAttribute('readonly');
    expect(
      screen.queryByTestId('edit-todo-default-list-note')
    ).not.toBeInTheDocument();
  });
});

describe('TaskDetailPanel', () => {
  test('shows task priority, list metadata rows, and calls edit/delete', () => {
    const onDelete = jest.fn();
    const onStartEdit = jest.fn();
    render(
      <TaskDetailPanel
        todo={{ ...todo, dueDate: '2026-08-05T00:00:00Z' }}
        list={list}
        onDelete={onDelete}
        onStartEdit={onStartEdit}
      />
    );

    expect(screen.getByText('Write tests')).toBeInTheDocument();
    expect(screen.getByText('tasks.priority_medium')).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('tasks.priority_low')).toBeInTheDocument();
    expect(screen.getByText('tasks.category_home')).toBeInTheDocument();
    expect(screen.getByText('tasks.status_pending')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'tasks.edit' }));
    expect(onStartEdit).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'tasks.delete' }));
    expect(onDelete).toHaveBeenCalledWith('todo-1');
  });

  test('shows an archive button only when an archive handler is given', () => {
    const onArchive = jest.fn();
    const { rerender } = render(
      <TaskDetailPanel
        todo={todo}
        list={list}
        onDelete={jest.fn()}
        onStartEdit={jest.fn()}
      />
    );
    expect(
      screen.queryByRole('button', { name: 'tasks.archive' })
    ).not.toBeInTheDocument();

    rerender(
      <TaskDetailPanel
        todo={todo}
        list={list}
        onDelete={jest.fn()}
        onArchive={onArchive}
        onStartEdit={jest.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'tasks.archive' }));
    expect(onArchive).toHaveBeenCalledWith('todo-1');
  });
});
