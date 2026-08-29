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
  priority: 'medium',
  source: 'web',
  ...extra,
});
describe('TodoItem', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-18T20:30:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test.each([
    ['pending', 'tasks.status_pending'],
    ['successful', 'tasks.status_successful'],
    ['failed', 'tasks.status_failed'],
  ] as const)('shows %s status', (status, label) => {
    render(<TodoItem todo={makeTodo(status)} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
  test('shows priority and formatted due date', () => {
    render(
      <TodoItem
        todo={makeTodo('pending', {
          dueDate: '2026-08-05T00:00:00Z',
          priority: 'high',
        })}
      />
    );
    expect(screen.getByText('tasks.priority_high')).toBeInTheDocument();
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
  test('selecting still works when clicking empty space in the controls row', () => {
    const select = jest.fn();
    const { container } = render(
      <TodoItem
        todo={makeTodo()}
        onSelect={select}
        onMoveUp={jest.fn()}
        canMoveUp
      />
    );
    const controlsRow = container.querySelector(
      '.flex.items-center.gap-2.mt-1'
    );
    expect(controlsRow).not.toBeNull();
    fireEvent.click(controlsRow as Element);
    expect(select).toHaveBeenCalledTimes(1);
  });
  test('calls edit without selecting', () => {
    const edit = jest.fn();
    const select = jest.fn();
    render(<TodoItem todo={makeTodo()} onEdit={edit} onSelect={select} />);
    fireEvent.click(screen.getByRole('button', { name: 'tasks.edit' }));
    expect(edit).toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();
  });
  test('shows a selected pill only when isSelected', () => {
    const { rerender } = render(<TodoItem todo={makeTodo()} />);
    expect(screen.queryByText('tasks.selected')).not.toBeInTheDocument();
    rerender(<TodoItem todo={makeTodo()} isSelected />);
    expect(screen.getByText('tasks.selected')).toBeInTheDocument();
  });
  test('marks completed task text as struck through', () => {
    render(<TodoItem todo={makeTodo('successful')} />);
    expect(screen.getByText('Write tests')).toHaveClass('line-through');
    expect(screen.getByText('tasks.status_successful')).toHaveClass(
      'text-status-complete'
    );
  });

  test('shows a due-soon badge and pulse dot for pending tasks due within 4 hours of end of day', () => {
    // system time is 20:30 on 2026-08-18, so a task due that day is ~3.5h from its deadline
    const { container } = render(
      <TodoItem todo={makeTodo('pending', { dueDate: '2026-08-18' })} />
    );
    expect(screen.getByText('tasks.dueSoon')).toBeInTheDocument();
    expect(container.querySelector('.bg-danger.rounded-full')).toHaveClass(
      'animate-pulse'
    );
  });

  test('does not show a due-soon badge when the due date is far away', () => {
    render(<TodoItem todo={makeTodo('pending', { dueDate: '2026-08-25' })} />);
    expect(screen.queryByText('tasks.dueSoon')).not.toBeInTheDocument();
  });

  test('does not show a due-soon badge for completed tasks', () => {
    render(
      <TodoItem todo={makeTodo('successful', { dueDate: '2026-08-18' })} />
    );
    expect(screen.queryByText('tasks.dueSoon')).not.toBeInTheDocument();
  });
});
