import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskPanelBar from './TaskPanelBar';

describe('TaskPanelBar', () => {
  test('goes back', () => {
    const onBack = jest.fn();
    render(<TaskPanelBar todoId="t1" onBack={onBack} onDelete={jest.fn()} />);
    fireEvent.click(screen.getByLabelText('tasks.backToList'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  test('deletes from the actions menu', async () => {
    const onDelete = jest.fn();
    render(<TaskPanelBar todoId="t1" onBack={jest.fn()} onDelete={onDelete} />);
    await userEvent.click(screen.getByTestId('task-actions-t1'));
    await userEvent.click(await screen.findByTestId('delete-todo-button-t1'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  test('offers archive only when there is an archive handler', async () => {
    const onArchive = jest.fn();
    const { rerender } = render(
      <TaskPanelBar todoId="t1" onBack={jest.fn()} onDelete={jest.fn()} />
    );
    await userEvent.click(screen.getByTestId('task-actions-t1'));
    expect(
      await screen.findByTestId('delete-todo-button-t1')
    ).toBeInTheDocument();
    expect(screen.queryByTestId('archive-todo-button-t1')).toBeNull();

    rerender(
      <TaskPanelBar
        todoId="t1"
        onBack={jest.fn()}
        onDelete={jest.fn()}
        onArchive={onArchive}
      />
    );
    await userEvent.click(await screen.findByTestId('archive-todo-button-t1'));
    expect(onArchive).toHaveBeenCalledTimes(1);
  });
});
