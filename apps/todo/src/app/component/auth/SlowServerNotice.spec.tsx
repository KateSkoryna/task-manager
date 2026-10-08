import { act, render, screen } from '@testing-library/react';
import SlowServerNotice from './SlowServerNotice';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('SlowServerNotice', () => {
  it('says nothing for a quick sign-in', () => {
    render(<SlowServerNotice pending />);

    act(() => jest.advanceTimersByTime(3000));

    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('explains the wait once sign-in is slow', () => {
    render(<SlowServerNotice pending />);

    act(() => jest.advanceTimersByTime(4000));

    expect(screen.getByRole('status')).toHaveTextContent('auth.slowServer');
  });

  it('stays empty when nothing is pending', () => {
    render(<SlowServerNotice pending={false} />);

    act(() => jest.advanceTimersByTime(10000));

    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
});
