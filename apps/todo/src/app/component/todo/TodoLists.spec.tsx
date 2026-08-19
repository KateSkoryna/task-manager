import { fireEvent, render, screen } from '@testing-library/react';
import TodoLists from './TodoLists';
jest.mock('../../lib/imageUtils', () => ({ uploadImage: jest.fn() }));
jest.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (s: { user: { firebaseUid: string } }) => unknown) =>
    selector({ user: { firebaseUid: 'u1' } }),
}));

const baseProps = {
  todoLists: [],
  isLoading: false,
  isError: false,
  error: null,
  refetch: jest.fn(),
  handleDeleteList: jest.fn(),
  handleAddTodo: jest.fn(),
};

describe('TodoLists', () => {
  test('shows a skeleton placeholder while loading', () => {
    render(<TodoLists {...baseProps} isLoading />);
    expect(
      screen.getByRole('status', { name: 'Loading todo lists' })
    ).toBeInTheDocument();
  });

  test('shows a retryable error state', () => {
    const refetch = jest.fn();
    render(
      <TodoLists
        {...baseProps}
        isError
        error={new Error('boom')}
        refetch={refetch}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(refetch).toHaveBeenCalled();
  });

  test('renders plain empty-state text when no create handler is given', () => {
    render(<TodoLists {...baseProps} />);
    expect(
      screen.queryByTestId('todolists-empty-create-list')
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('empty-todolists-message')).toBeInTheDocument();
  });

  test('renders a clickable New List action when a create handler is given', () => {
    const onCreateList = jest.fn();
    render(<TodoLists {...baseProps} onCreateList={onCreateList} />);
    fireEvent.click(screen.getByTestId('todolists-empty-create-list'));
    expect(onCreateList).toHaveBeenCalled();
  });
});
