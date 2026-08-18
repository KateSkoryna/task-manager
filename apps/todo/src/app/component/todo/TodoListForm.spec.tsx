import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodoListForm from './TodoListForm';

jest.mock('react-router-dom', () => ({ useParams: () => ({ userId: 'u1' }) }));

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
      screen.getByRole('button', { name: 'tasks.priority_high' })
    );
    await userEvent.click(category);
    const work = screen.getByRole('button', { name: 'tasks.category_work' });
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
      screen.getByRole('button', { name: 'tasks.priority_low' })
    );
    await userEvent.click(priority);
    await userEvent.click(
      screen.getByRole('button', { name: 'todoListForm.noPriority' })
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
