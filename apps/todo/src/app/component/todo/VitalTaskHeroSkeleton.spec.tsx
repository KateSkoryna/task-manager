import { render, screen } from '@testing-library/react';
import VitalTaskHeroSkeleton from './VitalTaskHeroSkeleton';

describe('VitalTaskHeroSkeleton', () => {
  test('renders a labeled loading status', () => {
    render(<VitalTaskHeroSkeleton />);
    expect(
      screen.getByRole('status', { name: 'Loading vital tasks' })
    ).toBeInTheDocument();
  });
});
