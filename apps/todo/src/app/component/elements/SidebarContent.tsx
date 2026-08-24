import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Flame,
  ListTodo,
  BarChart2,
  Settings,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { mergeClassNames } from '../../lib/classNames';

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
      <div className="flex items-center gap-3 border-b border-sidebar-border px-4 py-5">
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
          <p className="truncate text-xs text-sidebar-muted">
            {user?.email}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ to, labelKey, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              mergeClassNames(
                'flex items-center gap-3 rounded-lg px-3.5 py-3 text-sm transition-colors',
                isActive
                  ? 'bg-accent font-semibold text-on-accent'
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

      <div className="px-3 pb-6">
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
