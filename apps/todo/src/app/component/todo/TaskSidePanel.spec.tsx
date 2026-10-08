import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
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
        lists={[list]}
        onCreateList={jest.fn()}
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
        lists={[list]}
        onCreateList={jest.fn()}
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
        priority: 'high',
        category: undefined,
      })
    );
  }, 15000);
});

const otherList: TodoList = {
  id: 'list-2',
  name: 'Home',
  userId: 'user-1',
  todos: [],
  priority: 'high',
  category: 'work',
};
const inboxTodo: TodoItem = { ...todo, todolistId: null };

function renderEditPanel(
  props: Partial<React.ComponentProps<typeof TodoEditPanel>>
) {
  const onSave = jest.fn();
  const onCreateList = jest.fn();
  render(
    <MemoryRouter>
      <TodoEditPanel
        todo={inboxTodo}
        list={null}
        lists={[list, otherList]}
        onCreateList={onCreateList}
        onSave={onSave}
        onCancel={jest.fn()}
        {...props}
      />
    </MemoryRouter>
  );
  return { onSave, onCreateList };
}

async function pickList(
  user: ReturnType<typeof userEvent.setup>,
  name: string
) {
  const picker = screen.getByLabelText('tasks.list');
  await user.click(picker);
  await user.click(
    await within(picker.closest('details') as HTMLElement).findByRole(
      'button',
      { name }
    )
  );
}

describe('TodoEditPanel list picker', () => {
  test('an Inbox task has inactive list settings until a list is picked', async () => {
    const user = userEvent.setup();
    const { onSave } = renderEditPanel({});

    expect(screen.getByLabelText('tasks.list')).toHaveTextContent(
      'tasks.inbox'
    );
    expect(screen.getByLabelText('tasks.listPriority')).toHaveAttribute(
      'aria-disabled',
      'true'
    );
    expect(screen.getByLabelText('tasks.category')).toHaveAttribute(
      'aria-disabled',
      'true'
    );
    expect(screen.getByTestId('edit-todo-inbox-note')).toBeInTheDocument();

    await pickList(user, 'Home');

    expect(screen.getByLabelText('tasks.listPriority')).toHaveAttribute(
      'aria-disabled',
      'false'
    );
    expect(screen.getByLabelText('tasks.listPriority')).toHaveTextContent(
      'tasks.priority_high'
    );
    expect(screen.getByLabelText('tasks.category')).toHaveTextContent(
      'tasks.category_work'
    );
    expect(
      screen.queryByTestId('edit-todo-inbox-note')
    ).not.toBeInTheDocument();

    await user.click(screen.getByTestId('save-todo-edit-button-todo-1'));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0]).toEqual(
      expect.objectContaining({ todolistId: 'list-2' })
    );
    expect(onSave.mock.calls[0][1]).toEqual(
      expect.objectContaining({ priority: 'high', category: 'work' })
    );
    expect(onSave.mock.calls[0][2]).toBe(otherList);
  });

  test('moving a task to the Inbox clears and disables the list settings', async () => {
    const user = userEvent.setup();
    const { onSave } = renderEditPanel({ todo, list });

    await pickList(user, 'tasks.inbox');

    expect(screen.getByLabelText('tasks.listPriority')).toHaveAttribute(
      'aria-disabled',
      'true'
    );
    await user.click(screen.getByTestId('save-todo-edit-button-todo-1'));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0]).toEqual(
      expect.objectContaining({ todolistId: null })
    );
    expect(onSave.mock.calls[0][1]).toBeNull();
    expect(onSave.mock.calls[0][2]).toBeNull();
  });

  test('does not move the task when the list is left alone', async () => {
    const user = userEvent.setup();
    const { onSave } = renderEditPanel({ todo, list });

    await user.click(screen.getByTestId('save-todo-edit-button-todo-1'));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0]).not.toHaveProperty('todolistId');
    expect(onSave.mock.calls[0][2]).toBe(list);
  });

  test('adds a list from the picker with the list form and selects it', async () => {
    const user = userEvent.setup();
    const created: TodoList = { ...otherList, id: 'list-new', name: 'Garden' };
    const onCreateList = jest.fn().mockResolvedValue(created);
    const { onSave } = renderEditPanel({ onCreateList });

    await pickList(user, 'tasks.addList');
    expect(screen.getByTestId('edit-todo-new-list-dialog')).toBeInTheDocument();

    await user.type(screen.getByTestId('todolist-form-input'), 'Garden');
    await user.click(screen.getByTestId('todolist-form-submit-button'));

    await waitFor(() =>
      expect(
        screen.queryByTestId('edit-todo-new-list-dialog')
      ).not.toBeInTheDocument()
    );
    expect(onCreateList).toHaveBeenCalledWith('Garden', expect.anything());
    expect(screen.getByLabelText('tasks.list')).toHaveTextContent('Garden');

    await user.click(screen.getByTestId('save-todo-edit-button-todo-1'));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0]).toEqual(
      expect.objectContaining({ todolistId: 'list-new' })
    );
    expect(onSave.mock.calls[0][2]).toBe(created);
  });

  test('closes the list form without creating anything', async () => {
    const user = userEvent.setup();
    const { onCreateList } = renderEditPanel({});

    await pickList(user, 'tasks.addList');
    await user.click(
      screen.getByRole('button', { name: 'tasks.cancel', hidden: false })
    );

    expect(
      screen.queryByTestId('edit-todo-new-list-dialog')
    ).not.toBeInTheDocument();
    expect(onCreateList).not.toHaveBeenCalled();
    expect(screen.getByLabelText('tasks.list')).toHaveTextContent(
      'tasks.inbox'
    );
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
