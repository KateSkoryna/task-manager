import { useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { mergeClassNames } from '../../lib/classNames';
import { useActiveNavIndicator } from '../../hooks/useActiveNavIndicator';
import { NAV_ITEMS } from '../../lib/navItems';
import SidebarClock from './SidebarClock';

/**
 * Shared identity block, nav links, and logout — used by the persistent
 * desktop/tablet rail.
 */
function SidebarContent() {
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
  };

  return (
    <>
      <div className="flex items-center gap-3 border-b border-sidebar-border px-content-mobile md:px-content-tablet lg:px-content-desktop py-5">
        <div className="flex size-avatar shrink-0 items-center justify-center rounded-full bg-accent font-bold text-on-accent">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-bold text-sidebar-text">
            {user?.displayName}
          </p>
          <p className="truncate text-small text-sidebar-muted">
            {user?.email}
          </p>
        </div>
      </div>

      <nav
        ref={navRef}
        className="relative flex min-h-0 flex-col gap-1 overflow-y-auto px-content-mobile md:px-content-tablet lg:px-content-desktop py-4"
      >
        {box && (
          // One highlight that slides to the active link, instead of each link
          // switching its own background.
          <span
            aria-hidden="true"
            className={mergeClassNames(
              'pointer-events-none absolute left-0 top-0 rounded-control bg-accent',
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
        {NAV_ITEMS.map(({ to, labelKey, icon: Icon, end, tourId }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            data-tour={tourId}
            className={({ isActive }) =>
              mergeClassNames(
                'relative flex items-center gap-3 rounded-control px-3.5 py-3 text-body transition-colors duration-300 motion-reduce:transition-none',
                isActive
                  ? 'font-bold text-on-accent'
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

      {/* The nav only takes the room its links need. The clock fills 80% of
          the space left above Logout, whatever size the screen is. */}
      <div className="grid min-h-0 flex-1 place-items-center [container-type:size]">
        <SidebarClock />
      </div>

      <div className="px-content-mobile md:px-content-tablet lg:px-content-desktop pb-6 pt-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-control px-3.5 py-3 text-body text-sidebar-muted transition-colors hover:bg-sidebar-text/10"
        >
          <LogOut className="size-4 shrink-0 text-sidebar-muted" />
          {t('nav.logout')}
        </button>
      </div>
    </>
  );
}

export default SidebarContent;
