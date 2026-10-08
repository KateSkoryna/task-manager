import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodoListForm from './TodoListForm';

jest.mock('react-router-dom', () => ({ useParams: () => ({ userId: 'u1' }) }));

describe('TodoListForm layout', () => {
  test('shows the extra fields above the create button', async () => {
    render(<TodoListForm onSubmit={jest.fn()} isSubmitting={false} />);
    await userEvent.click(
      screen.getByRole('button', { name: 'todoListForm.more' })
    );

    const priority = screen.getByLabelText('todoListForm.priority');
    const create = screen.getByTestId('todolist-form-submit-button');
    // DOM order is what a phone shows top to bottom.
    expect(
      priority.compareDocumentPosition(create) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});

describe('TodoListForm dropdowns', () => {
  test('submits selected optional metadata from named semantic dropdowns', async () => {
    const onSubmit = jest.fn();
    render(<TodoListForm onSubmit={onSubmit} isSubmitting={false} />);
    await userEvent.type(screen.getByTestId('todolist-form-input'), 'My list');
    await userEvent.click(
      screen.getByRole('button', { name: 'todoListForm.more' })
    );

    const priority = screen.getByLabelText('todoListForm.priority');
    const category = screen.getByLabelText('todoListForm.category');
    expect(priority.tagName).toBe('SUMMARY');
    expect(category.tagName).toBe('SUMMARY');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();

    await userEvent.click(priority);
    await userEvent.click(
      await screen.findByRole('button', { name: 'tasks.priority_high' })
    );
    await userEvent.click(category);
    const work = await screen.findByRole('button', {
      name: 'tasks.category_work',
    });
    work.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.click(screen.getByTestId('todolist-form-submit-button'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith('My list', {
        priority: 'high',
        category: 'work',
        dueDate: null,
        notes: null,
      })
    );
  });

  test('clears a selected optional value through its null button', async () => {
    const onSubmit = jest.fn();
    render(<TodoListForm onSubmit={onSubmit} isSubmitting={false} />);
    await userEvent.type(screen.getByTestId('todolist-form-input'), 'Clear');
    await userEvent.click(
      screen.getByRole('button', { name: 'todoListForm.more' })
    );
    const priority = screen.getByLabelText('todoListForm.priority');
    await userEvent.click(priority);
    await userEvent.click(
      await screen.findByRole('button', { name: 'tasks.priority_low' })
    );
    await userEvent.click(priority);
    await userEvent.click(
      await screen.findByRole('button', { name: 'todoListForm.noPriority' })
    );
    await userEvent.click(screen.getByTestId('todolist-form-submit-button'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        'Clear',
        expect.objectContaining({ priority: undefined })
      )
    );
  });
});

describe('TodoListForm default lists', () => {
  const defaultList = {
    id: 'l1',
    name: 'Work',
    userId: 'u1',
    todos: [],
    category: 'work' as const,
    isDefault: true,
  };

  test('locks the name of a default list and says why', () => {
    render(
      <TodoListForm
        todoList={defaultList}
        onSubmit={jest.fn()}
        isSubmitting={false}
      />
    );
    expect(screen.getByTestId('todolist-form-input')).toHaveAttribute(
      'readonly'
    );
    expect(
      screen.getByTestId('todolist-form-default-note')
    ).toBeInTheDocument();
  });

  test('keeps the name editable for an ordinary list and for a new list', () => {
    const { rerender } = render(
      <TodoListForm
        todoList={{ ...defaultList, isDefault: false }}
        onSubmit={jest.fn()}
        isSubmitting={false}
      />
    );
    expect(screen.getByTestId('todolist-form-input')).not.toHaveAttribute(
      'readonly'
    );

    rerender(<TodoListForm onSubmit={jest.fn()} isSubmitting={false} />);
    expect(screen.getByTestId('todolist-form-input')).not.toHaveAttribute(
      'readonly'
    );
    expect(
      screen.queryByTestId('todolist-form-default-note')
    ).not.toBeInTheDocument();
  });
});
