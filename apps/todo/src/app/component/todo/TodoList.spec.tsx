import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TodoList from './TodoList';
import { TodoList as List } from '@shared/types';
import {
  initialListViewState,
  useListViewStore,
} from '../../store/listViewStore';
jest.mock('../../lib/imageUtils', () => ({ uploadImage: jest.fn() }));
jest.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (s: { user: { firebaseUid: string } }) => unknown) =>
    selector({ user: { firebaseUid: 'u1' } }),
}));
jest.mock('react-router-dom', () => ({ useParams: () => ({ userId: 'u1' }) }));

const base: List = {
  id: 'list-1',
  name: 'Work',
  userId: 'u',
  priority: 'medium',
  category: 'work',
  dueDate: '2026-08-05',
  notes: 'Important',
  todos: [],
};
const task = {
  id: 't1',
  name: 'Task',
  status: 'pending' as const,
  todolistId: 'list-1',
  order: 0,
  priority: 'medium' as const,
  source: 'web' as const,
};
describe('TodoList', () => {
  beforeEach(() => useListViewStore.setState(initialListViewState));
  test('shows title, metadata and empty state once expanded', () => {
    render(
      <TodoList
        todoList={base}
        onAddTodo={jest.fn()}
        onDeleteList={jest.fn()}
      />
    );
    expect(screen.getByTestId('todolist-title')).toHaveTextContent('Work');
    expect(screen.getByText(/0\/0/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Expand' }));
    expect(screen.getByTestId('empty-todos-message')).toBeInTheDocument();
  });
  test('starts collapsed when the list has no tasks', () => {
    render(
      <TodoList
        todoList={base}
        onAddTodo={jest.fn()}
        onDeleteList={jest.fn()}
      />
    );
    expect(screen.queryByTestId('empty-todos-message')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand' })).toBeInTheDocument();
  });
  test('starts expanded when the list has tasks', () => {
    render(
      <TodoList
        todoList={{ ...base, todos: [task] }}
        onAddTodo={jest.fn()}
        onDeleteList={jest.fn()}
      />
    );
    expect(screen.getByTestId('todo-item-t1')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Collapse' })
    ).toBeInTheDocument();
  });
  test('collapses and expands content', () => {
    render(
      <TodoList
        todoList={base}
        onAddTodo={jest.fn()}
        onDeleteList={jest.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Expand' }));
    expect(screen.getByTestId('empty-todos-message')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Collapse' }));
    expect(screen.queryByTestId('empty-todos-message')).not.toBeInTheDocument();
  });
  test('remembers collapsed state when the list is shown again', () => {
    const withTask = { ...base, todos: [task] };
    const props = { onAddTodo: jest.fn(), onDeleteList: jest.fn() };
    const first = render(<TodoList todoList={withTask} {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Collapse' }));
    expect(screen.queryByTestId('todo-item-t1')).not.toBeInTheDocument();
    first.unmount();

    // Leaving the page and coming back mounts a fresh component.
    render(<TodoList todoList={withTask} {...props} />);
    expect(screen.queryByTestId('todo-item-t1')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand' })).toBeInTheDocument();
  });
  test('deletes list', () => {
    const del = jest.fn();
    render(
      <TodoList todoList={base} onAddTodo={jest.fn()} onDeleteList={del} />
    );
    fireEvent.click(screen.getByTestId('todolist-item-delete-button'));
    expect(del).toHaveBeenCalledWith('list-1');
  });
  test('has no delete button for a default list', () => {
    render(
      <TodoList
        todoList={{ ...base, isDefault: true }}
        onAddTodo={jest.fn()}
        onDeleteList={jest.fn()}
      />
    );
    expect(
      screen.queryByTestId('todolist-item-delete-button')
    ).not.toBeInTheDocument();
  });
  test('opens add form from header', () => {
    render(
      <TodoList
        todoList={base}
        onAddTodo={jest.fn()}
        onDeleteList={jest.fn()}
      />
    );
    fireEvent.click(screen.getAllByRole('button', { name: /add task/i })[0]);
    expect(screen.getByTestId('todo-form-input')).toBeInTheDocument();
  });
  test('renders todo items and completion count', () => {
    const todos = [
      {
        id: 't',
        name: 'Task',
        status: 'successful' as const,
        todolistId: 'list-1',
        order: 0,
        priority: 'medium' as const,
        source: 'web' as const,
      },
    ];
    render(
      <TodoList
        todoList={{ ...base, todos }}
        onAddTodo={jest.fn()}
        onDeleteList={jest.fn()}
      />
    );
    expect(screen.getByText('1/1')).toBeInTheDocument();
    expect(screen.getByText('Task')).toBeInTheDocument();
  });
  test('selects and edits a todo', () => {
    const select = jest.fn();
    const edit = jest.fn();
    const todo = {
      id: 't',
      name: 'Task',
      status: 'pending' as const,
      todolistId: 'list-1',
      order: 0,
      priority: 'medium' as const,
      source: 'web' as const,
    };
    render(
      <TodoList
        todoList={{ ...base, todos: [todo] }}
        onAddTodo={jest.fn()}
        onDeleteList={jest.fn()}
        onSelectTodo={select}
        onEditTodo={edit}
      />
    );
    fireEvent.click(screen.getByTestId('todo-item-t'));
    fireEvent.click(screen.getByRole('button', { name: 'tasks.edit' }));
    expect(select).toHaveBeenCalledWith(todo);
    expect(edit).toHaveBeenCalledWith(todo);
  });
  test('passes list id and closes add form after submit', async () => {
    const add = jest.fn();
    render(
      <TodoList todoList={base} onAddTodo={add} onDeleteList={jest.fn()} />
    );
    fireEvent.click(screen.getAllByRole('button', { name: /add task/i })[0]);
    fireEvent.change(screen.getByTestId('todo-form-input'), {
      target: { value: 'New task' },
    });
    fireEvent.click(screen.getByTestId('todo-form-submit-button'));
    await waitFor(() =>
      expect(add).toHaveBeenCalledWith('list-1', 'New task', undefined)
    );
  });
  test('opens add form from empty-state link', () => {
    render(
      <TodoList
        todoList={base}
        onAddTodo={jest.fn()}
        onDeleteList={jest.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Expand' }));
    fireEvent.click(screen.getAllByRole('button', { name: /add task/i })[1]);
    expect(screen.getByTestId('todo-form-input')).toBeInTheDocument();
  });
  test('does not show an edit-list button when onEditList is not provided', () => {
    render(
      <TodoList
        todoList={base}
        onAddTodo={jest.fn()}
        onDeleteList={jest.fn()}
      />
    );
    expect(
      screen.queryByRole('button', { name: 'todoListForm.editList' })
    ).not.toBeInTheDocument();
  });
  test('opens the edit-list form pre-filled and submits updates', async () => {
    const onEditList = jest.fn();
    render(
      <TodoList
        todoList={base}
        onAddTodo={jest.fn()}
        onDeleteList={jest.fn()}
        onEditList={onEditList}
      />
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'todoListForm.editList' })
    );
    expect(screen.getByTestId('todolist-form-input')).toHaveValue('Work');
    fireEvent.click(screen.getByTestId('todolist-form-submit-button'));
    await waitFor(() =>
      expect(onEditList).toHaveBeenCalledWith(
        'list-1',
        expect.objectContaining({ name: 'Work', priority: 'medium' })
      )
    );
    expect(screen.queryByTestId('todolist-form-input')).not.toBeInTheDocument();
  });
});
