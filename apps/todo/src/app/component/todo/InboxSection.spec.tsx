import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InboxSection from './InboxSection';

jest.mock('../../fetchers/api', () => ({
  useAddInboxTodoMutation: () => ({ mutate: jest.fn() }),
  useEditTodoMutation: () => ({ mutate: jest.fn() }),
  useParseTodoMutation: () => ({ mutate: jest.fn() }),
  useInboxTodosQuery: () => ({ data: [] }),
}));
jest.mock('../../lib/imageUtils', () => ({
  uploadImage: jest.fn().mockResolvedValue('https://cdn/image.png'),
}));
jest.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (s: { user: { firebaseUid: string } }) => unknown) =>
    selector({ user: { firebaseUid: 'u1' } }),
}));

describe('InboxSection', () => {
  test('renders the quick-capture input', () => {
    render(<InboxSection todos={[]} onAddTodo={jest.fn()} />);
    expect(screen.getByTestId('inbox-quick-capture-input')).toBeInTheDocument();
    expect(
      screen.getByTestId('inbox-quick-capture-submit')
    ).toBeInTheDocument();
  });

  test('keeps TodoForm reachable for manual entry', async () => {
    render(<InboxSection todos={[]} onAddTodo={jest.fn()} />);
    expect(
      screen.queryByTestId('todo-form-toggle-extra')
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /add task/i }));
    expect(screen.getByTestId('todo-form-toggle-extra')).toBeInTheDocument();
  });
});
