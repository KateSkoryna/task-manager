import { render, screen } from '@testing-library/react';
import ContentSkeleton from './ContentSkeleton';

describe('ContentSkeleton', () => {
  test('renders a labeled loading status', () => {
    render(<ContentSkeleton />);
    expect(
      screen.getByRole('status', { name: 'Loading content' })
    ).toBeInTheDocument();
  });
});
