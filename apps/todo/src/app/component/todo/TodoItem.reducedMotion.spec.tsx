import { render, screen } from '@testing-library/react';
import TodoItem from './TodoItem';
import { TodoItem as Todo } from '@shared/types';

jest.mock('../../hooks/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: () => true,
}));

const makeTodo = (extra: Partial<Todo> = {}): Todo => ({
  id: '1',
  name: 'Write tests',
  status: 'pending',
  todolistId: 'l',
  order: 0,
  dueDate: '2026-08-18',
  priority: 'medium',
  source: 'web',
  ...extra,
});

describe('TodoItem with prefers-reduced-motion', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-18T20:30:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('still shows the due-soon badge but skips the pulse animation', () => {
    const { container } = render(<TodoItem todo={makeTodo()} />);
    expect(screen.getByText('tasks.dueSoon')).toBeInTheDocument();
    expect(container.querySelector('.bg-red-500.rounded-full')).not.toHaveClass(
      'animate-pulse'
    );
  });
});
