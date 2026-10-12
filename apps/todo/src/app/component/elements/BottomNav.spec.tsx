import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import BottomNav from './BottomNav';
import { useMobileMenuStore } from '../../store/mobileMenuStore';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <BottomNav />
    </MemoryRouter>
  );
}

jest.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (state: { logout: () => void }) => unknown) =>
    selector({ logout: jest.fn() }),
}));

describe('BottomNav', () => {
  beforeEach(() => useMobileMenuStore.setState({ isOpen: false }));

  test('shows four links and a More button', () => {
    renderAt('/');
    expect(screen.getAllByRole('link')).toHaveLength(4);
    expect(
      screen.getByRole('button', { name: 'nav.more' })
    ).toBeInTheDocument();
  });

  test('marks the current page', () => {
    renderAt('/tasks');
    expect(screen.getByRole('link', { name: 'nav.myTasks' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(
      screen.getByRole('link', { name: 'nav.dashboard' })
    ).not.toHaveAttribute('aria-current');
  });

  test('opens the drawer from More', async () => {
    renderAt('/');
    await userEvent.click(screen.getByRole('button', { name: 'nav.more' }));
    expect(useMobileMenuStore.getState().isOpen).toBe(true);
    expect(
      screen.getByRole('link', { name: 'nav.settings' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'nav.logout' })
    ).toBeInTheDocument();
  });

  test('closes the menu with Escape', async () => {
    renderAt('/');
    await userEvent.click(screen.getByRole('button', { name: 'nav.more' }));
    await userEvent.keyboard('{Escape}');
    expect(useMobileMenuStore.getState().isOpen).toBe(false);
  });
});
