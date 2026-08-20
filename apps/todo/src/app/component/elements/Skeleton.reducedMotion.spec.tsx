import { render } from '@testing-library/react';
import Skeleton from './Skeleton';

jest.mock('../../hooks/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: () => true,
}));

describe('Skeleton with prefers-reduced-motion', () => {
  test('skips the pulse animation', () => {
    const { container } = render(<Skeleton className="h-4 w-32" />);
    const el = container.firstChild as HTMLElement;
    expect(el).not.toHaveClass('animate-pulse');
  });
});
