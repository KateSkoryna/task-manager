import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SidebarContent from './SidebarContent';

jest.mock('../../store/authStore', () => ({
  useAuthStore: (
    selector: (state: { user: null; logout: () => void }) => unknown
  ) => selector({ user: null, logout: jest.fn() }),
}));

jest.mock('../../hooks/usePreferences', () => ({
  usePreferences: () => ({ preferences: { timezone: 'Europe/Berlin' } }),
}));

function renderSidebar(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SidebarContent />
    </MemoryRouter>
  );
}

const highlight = () => document.querySelector('nav > span[aria-hidden]');

describe('SidebarContent active highlight', () => {
  test('shows one highlight and marks the current page link', () => {
    renderSidebar('/tasks');
    expect(highlight()).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'nav.myTasks' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  test('keeps a single highlight when the page changes', async () => {
    renderSidebar('/tasks');
    await userEvent.click(screen.getByRole('link', { name: 'nav.settings' }));
    expect(document.querySelectorAll('nav > span[aria-hidden]')).toHaveLength(
      1
    );
    expect(screen.getByRole('link', { name: 'nav.settings' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  test('shows no highlight on a page that is not in the menu', () => {
    renderSidebar('/somewhere-else');
    expect(highlight()).not.toBeInTheDocument();
  });

  test('shows the clock between the page links and Logout', () => {
    renderSidebar('/tasks');
    const clock = screen.getByTestId('sidebar-clock');
    const nav = screen.getByRole('navigation');
    const logout = screen.getByRole('button', { name: 'nav.logout' });
    expect(
      nav.compareDocumentPosition(clock) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      clock.compareDocumentPosition(logout) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});
