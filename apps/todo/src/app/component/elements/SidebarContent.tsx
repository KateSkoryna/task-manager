import { useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Flame,
  ListTodo,
  BarChart2,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { mergeClassNames } from '../../lib/classNames';
import { useActiveNavIndicator } from '../../hooks/useActiveNavIndicator';
import SidebarClock from './SidebarClock';

const NAV_ITEMS = [
  { to: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/vital', labelKey: 'nav.vitalTasks', icon: Flame, end: false },
  { to: '/tasks', labelKey: 'nav.myTasks', icon: ListTodo, end: false },
  {
    to: '/statistics',
    labelKey: 'nav.statistics',
    icon: BarChart2,
    end: false,
  },
  { to: '/reports', labelKey: 'nav.reports', icon: FileText, end: false },
  { to: '/settings', labelKey: 'nav.settings', icon: Settings, end: false },
  { to: '/help', labelKey: 'nav.help', icon: HelpCircle, end: false },
];

type SidebarContentProps = {
  /** The drawer avatar is slightly larger than the persistent rail's. */
  avatarSize?: 'default' | 'drawer';
  /** Called after any action that should close the mobile drawer. */
  onNavigate?: () => void;
};

/**
 * Shared identity block, nav links, and logout — reused by the persistent
 * desktop/tablet rail and the mobile drawer so both stay in sync.
 */
function SidebarContent({
  avatarSize = 'default',
  onNavigate,
}: SidebarContentProps) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const navRef = useRef<HTMLElement>(null);
  const { box, animate } = useActiveNavIndicator(navRef);

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';

  const handleLogout = () => {
    logout();
    navigate('/login');
    onNavigate?.();
  };

  return (
    <>
      <div className="flex items-center gap-3 border-b border-sidebar-border px-content-mobile md:px-content-tablet lg:px-content-desktop py-5">
        <div
          className={mergeClassNames(
            'flex shrink-0 items-center justify-center rounded-full bg-accent font-bold text-on-accent',
            avatarSize === 'drawer' ? 'size-avatar-drawer' : 'size-avatar'
          )}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-sidebar-text">
            {user?.displayName}
          </p>
          <p className="truncate text-xs text-sidebar-muted">{user?.email}</p>
        </div>
      </div>

      <nav
        ref={navRef}
        className="relative min-h-0 space-y-1 overflow-y-auto px-content-mobile md:px-content-tablet lg:px-content-desktop py-4"
      >
        {box && (
          // One highlight that slides to the active link, instead of each link
          // switching its own background.
          <span
            aria-hidden="true"
            className={mergeClassNames(
              'pointer-events-none absolute left-0 top-0 rounded-lg bg-accent',
              animate &&
                'transition-[transform,width,height] duration-300 ease-out motion-reduce:transition-none'
            )}
            style={{
              width: box.width,
              height: box.height,
              transform: `translate(${box.left}px, ${box.top}px)`,
            }}
          />
        )}
        {NAV_ITEMS.map(({ to, labelKey, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              mergeClassNames(
                'relative flex items-center gap-3 rounded-lg px-3.5 py-3 text-sm transition-colors duration-300 motion-reduce:transition-none',
                isActive
                  ? 'font-semibold text-on-accent'
                  : 'text-sidebar-text hover:bg-sidebar-text/10'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={mergeClassNames(
                    'size-4 shrink-0',
                    isActive ? 'text-on-accent' : 'text-sidebar-muted'
                  )}
                />
                {t(labelKey)}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* The nav only takes the room its links need, so the auto margins
          centre the clock in the space left above Logout. */}
      <SidebarClock className="my-auto" />

      <div className="px-content-mobile md:px-content-tablet lg:px-content-desktop pb-6 pt-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3.5 py-3 text-sm text-sidebar-muted transition-colors hover:bg-sidebar-text/10"
        >
          <LogOut className="size-4 shrink-0 text-sidebar-muted" />
          {t('nav.logout')}
        </button>
      </div>
    </>
  );
}

export default SidebarContent;
