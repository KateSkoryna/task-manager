import { render, screen } from '@testing-library/react';
import SidebarSkeleton from './SidebarSkeleton';

describe('SidebarSkeleton', () => {
  test('renders a labeled loading status', () => {
    render(<SidebarSkeleton />);
    expect(
      screen.getByRole('status', { name: 'Loading navigation' })
    ).toBeInTheDocument();
  });
});
