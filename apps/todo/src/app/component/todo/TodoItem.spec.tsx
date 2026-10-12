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
    expect(screen.getByText('tasks.due')).toBeInTheDocument();
    expect(screen.getByText('5 Aug')).toBeInTheDocument();
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
      <TodoItem todo={makeTodo()} onSelect={select} />
    );
    const controlsRow = container.querySelector(
      '.flex.flex-nowrap.items-center'
    );
    expect(controlsRow).not.toBeNull();
    fireEvent.click(controlsRow as Element);
    expect(select).toHaveBeenCalledTimes(1);
  });
  test('shows a selected pill only when isSelected', () => {
    const { rerender } = render(<TodoItem todo={makeTodo()} />);
    expect(screen.queryByText('tasks.selected')).not.toBeInTheDocument();
    rerender(<TodoItem todo={makeTodo()} isSelected />);
    expect(screen.getByText('tasks.selected')).toBeInTheDocument();
  });
  test('dims completed task text without striking it through', () => {
    render(<TodoItem todo={makeTodo('successful')} />);
    expect(screen.getByText('Write tests')).toHaveClass('text-muted');
    expect(screen.getByText('Write tests')).not.toHaveClass('line-through');
  });

  test('renders notes only when the task has them', () => {
    const { rerender } = render(
      <TodoItem todo={makeTodo('pending', { notes: '' })} />
    );
    expect(screen.queryByText('Buy milk')).not.toBeInTheDocument();
    rerender(<TodoItem todo={makeTodo('pending', { notes: 'Buy milk' })} />);
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
  });

  describe('quick complete', () => {
    test('has no check unless a handler is given', () => {
      render(<TodoItem todo={makeTodo()} />);
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    test('shows whether the task is completed', () => {
      const { rerender } = render(
        <TodoItem todo={makeTodo('pending')} onToggleComplete={jest.fn()} />
      );
      expect(screen.getByRole('checkbox')).toHaveAttribute(
        'aria-checked',
        'false'
      );

      rerender(
        <TodoItem todo={makeTodo('successful')} onToggleComplete={jest.fn()} />
      );
      expect(screen.getByRole('checkbox')).toHaveAttribute(
        'aria-checked',
        'true'
      );
    });

    test('toggles without selecting the task', () => {
      jest.useRealTimers();
      const onToggleComplete = jest.fn();
      const onSelect = jest.fn();
      render(
        <TodoItem
          todo={makeTodo()}
          onSelect={onSelect}
          onToggleComplete={onToggleComplete}
        />
      );

      fireEvent.click(screen.getByRole('checkbox'));
      fireEvent.keyDown(screen.getByRole('checkbox'), { key: 'Enter' });

      expect(onToggleComplete).toHaveBeenCalledTimes(1);
      expect(onSelect).not.toHaveBeenCalled();
    });
  });
});
