import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TodoList from './TodoList';
import { TodoList as List } from '@shared/types';
jest.mock('../../lib/imageUtils', () => ({ uploadImage: jest.fn() }));
jest.mock('../../store/authStore', () => ({ useAuthStore: (selector: (s: { user: { firebaseUid: string } }) => unknown) => selector({ user: { firebaseUid: 'u1' } }) }));

const base: List = { id: 'list-1', name: 'Work', userId: 'u', priority: 'medium', category: 'work', dueDate: '2026-08-05', notes: 'Important', todos: [] };
describe('TodoList', () => {
  test('shows title, metadata and empty state', () => { render(<TodoList todoList={base} onAddTodo={jest.fn()} onDeleteList={jest.fn()} />); expect(screen.getByTestId('todolist-title')).toHaveTextContent('Work'); expect(screen.getByText(/0\/0/)).toBeInTheDocument(); expect(screen.getByTestId('empty-todos-message')).toBeInTheDocument(); });
  test('collapses and expands content', () => { render(<TodoList todoList={base} onAddTodo={jest.fn()} onDeleteList={jest.fn()} />); fireEvent.click(screen.getByRole('button', { name: 'Collapse' })); expect(screen.queryByTestId('empty-todos-message')).not.toBeInTheDocument(); fireEvent.click(screen.getByRole('button', { name: 'Expand' })); expect(screen.getByTestId('empty-todos-message')).toBeInTheDocument(); });
  test('deletes list', () => { const del = jest.fn(); render(<TodoList todoList={base} onAddTodo={jest.fn()} onDeleteList={del} />); fireEvent.click(screen.getByTestId('todolist-item-delete-button')); expect(del).toHaveBeenCalledWith('list-1'); });
  test('opens add form from header', () => { render(<TodoList todoList={base} onAddTodo={jest.fn()} onDeleteList={jest.fn()} />); fireEvent.click(screen.getAllByRole('button', { name: /add task/i })[0]); expect(screen.getByTestId('todo-form-input')).toBeInTheDocument(); });
  test('renders todo items and completion count', () => { const todos = [{ id: 't', name: 'Task', status: 'successful' as const, todolistId: 'list-1' }]; render(<TodoList todoList={{ ...base, todos }} onAddTodo={jest.fn()} onDeleteList={jest.fn()} />); expect(screen.getByText('1/1')).toBeInTheDocument(); expect(screen.getByText('Task')).toBeInTheDocument(); });
  test('selects and edits a todo', () => { const select = jest.fn(); const edit = jest.fn(); const todo = { id: 't', name: 'Task', status: 'pending' as const, todolistId: 'list-1' }; render(<TodoList todoList={{ ...base, todos: [todo] }} onAddTodo={jest.fn()} onDeleteList={jest.fn()} onSelectTodo={select} onEditTodo={edit} />); fireEvent.click(screen.getByTestId('todo-item-t')); fireEvent.click(screen.getByLabelText('Edit task')); expect(select).toHaveBeenCalledWith(todo); expect(edit).toHaveBeenCalledWith(todo); });
  test('passes list id and closes add form after submit', async () => { const add = jest.fn(); render(<TodoList todoList={base} onAddTodo={add} onDeleteList={jest.fn()} />); fireEvent.click(screen.getAllByRole('button', { name: /add task/i })[0]); fireEvent.change(screen.getByTestId('todo-form-input'), { target: { value: 'New task' } }); fireEvent.click(screen.getByTestId('todo-form-submit-button')); await waitFor(() => expect(add).toHaveBeenCalledWith('list-1', 'New task', undefined)); });
  test('opens add form from empty-state link', () => { render(<TodoList todoList={base} onAddTodo={jest.fn()} onDeleteList={jest.fn()} />); fireEvent.click(screen.getAllByRole('button', { name: /add task/i })[1]); expect(screen.getByTestId('todo-form-input')).toBeInTheDocument(); });
});
