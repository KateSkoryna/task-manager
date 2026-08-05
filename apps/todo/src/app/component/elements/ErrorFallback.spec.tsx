import { fireEvent, render, screen } from '@testing-library/react';
import ErrorFallback from './ErrorFallback';

describe('ErrorFallback', () => {
  test('renders title and message', () => {
    render(<ErrorFallback error={new Error('Broken')} />);
    expect(screen.getByTestId('error-title')).toBeInTheDocument();
    expect(screen.getByTestId('error-message')).toHaveTextContent('Broken');
  });
  test('renders retry action when provided', () => {
    const retry = jest.fn();
    render(<ErrorFallback error={new Error('x')} resetErrorBoundary={retry} />);
    fireEvent.click(screen.getByRole('button'));
    expect(retry).toHaveBeenCalledTimes(1);
  });
  test('applies custom class', () => {
    render(<ErrorFallback error={new Error('x')} className="custom" />);
    expect(screen.getByTestId('error-title').parentElement).toHaveClass(
      'custom'
    );
  });
});
