import { fireEvent, render, screen } from '@testing-library/react';
import TodoItem from './TodoItem';
import { TodoItem as Todo } from '@shared/types';

const makeTodo = (
  status: Todo['status'] = 'pending',
  extra: Partial<Todo> = {}
): Todo => ({
  id: '1',
  name: 'Write tests',
  status,
  todolistId: 'l',
  order: 0,
  ...extra,
});
describe('TodoItem', () => {
  test.each([
    ['pending', 'In Progress'],
    ['successful', 'Completed'],
    ['failed', 'Not Started'],
  ] as const)('shows %s status', (status, label) => {
    render(<TodoItem todo={makeTodo(status)} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
  test('shows priority and formatted due date', () => {
    render(
      <TodoItem
        todo={makeTodo('pending', { dueDate: '2026-08-05T00:00:00Z' })}
        listPriority="high"
      />
    );
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText(/Due:/)).toBeInTheDocument();
  });
  test('renders attached image', () => {
    render(
      <TodoItem
        todo={makeTodo('pending', { image: 'https://example.com/x.png' })}
      />
    );
    expect(screen.getByAltText('Attached')).toHaveAttribute(
      'src',
      'https://example.com/x.png'
    );
  });
  test('selects by click and Enter', () => {
    const select = jest.fn();
    render(<TodoItem todo={makeTodo()} onSelect={select} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(select).toHaveBeenCalledTimes(2);
  });
  test('calls edit without selecting', () => {
    const edit = jest.fn();
    const select = jest.fn();
    render(<TodoItem todo={makeTodo()} onEdit={edit} onSelect={select} />);
    fireEvent.click(screen.getByLabelText('Edit task'));
    expect(edit).toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();
  });
  test('marks completed task text as struck through', () => {
    render(<TodoItem todo={makeTodo('successful')} />);
    expect(screen.getByText('Write tests')).toHaveClass('line-through');
  });
});
