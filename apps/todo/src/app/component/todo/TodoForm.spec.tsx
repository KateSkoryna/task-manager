import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodoForm from './TodoForm';

jest.mock('../../lib/imageUtils', () => ({
  uploadImage: jest.fn().mockResolvedValue('https://cdn/image.png'),
}));
jest.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (s: { user: { firebaseUid: string } }) => unknown) =>
    selector({ user: { firebaseUid: 'u1' } }),
}));

describe('TodoForm', () => {
  test('renders accessible name input and submit', () => {
    render(<TodoForm onAddTodo={jest.fn()} />);
    expect(screen.getByLabelText(/todo name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });
  test('shows validation for empty name', async () => {
    render(<TodoForm onAddTodo={jest.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(await screen.findByTestId('todo-error-message')).toBeInTheDocument();
  });
  test('submits trimmed name', async () => {
    const add = jest.fn();
    render(<TodoForm onAddTodo={add} />);
    await userEvent.type(screen.getByLabelText(/todo name/i), '  Plan  ');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    await waitFor(() => expect(add).toHaveBeenCalledWith('Plan', undefined));
  });
  test('reveals optional fields', async () => {
    render(<TodoForm onAddTodo={jest.fn()} />);
    await userEvent.click(screen.getByTestId('todo-form-toggle-extra'));
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
  });
  test('passes trimmed optional fields', async () => {
    const add = jest.fn();
    render(<TodoForm onAddTodo={add} />);
    await userEvent.type(screen.getByLabelText(/todo name/i), 'Task');
    await userEvent.click(screen.getByTestId('todo-form-toggle-extra'));
    await userEvent.type(screen.getByLabelText(/location/i), ' office ');
    await userEvent.type(screen.getByLabelText(/notes/i), ' note ');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    await waitFor(() =>
      expect(add).toHaveBeenCalledWith('Task', {
        location: 'office',
        notes: 'note',
      })
    );
  });
  test('uploads and previews image', async () => {
    render(<TodoForm onAddTodo={jest.fn()} />);
    await userEvent.click(screen.getByTestId('todo-form-toggle-extra'));
    const input = screen.getByTestId('todo-form-image');
    const file = new File(['x'], 'x.png', { type: 'image/png' });
    await userEvent.upload(input, file);
    expect(await screen.findByAltText('Preview')).toBeInTheDocument();
  });
  test('removes image preview', async () => {
    render(<TodoForm onAddTodo={jest.fn()} />);
    await userEvent.click(screen.getByTestId('todo-form-toggle-extra'));
    await userEvent.upload(
      screen.getByTestId('todo-form-image'),
      new File(['x'], 'x.png', { type: 'image/png' })
    );
    await userEvent.click(await screen.findByLabelText('Remove image'));
    expect(screen.queryByAltText('Preview')).not.toBeInTheDocument();
  });
  test('hides optional fields again', () => {
    render(<TodoForm onAddTodo={jest.fn()} />);
    fireEvent.click(screen.getByTestId('todo-form-toggle-extra'));
    fireEvent.click(screen.getByTestId('todo-form-toggle-extra'));
    expect(screen.queryByLabelText(/location/i)).not.toBeInTheDocument();
  });
});
