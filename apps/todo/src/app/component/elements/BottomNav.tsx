import { useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { mergeClassNames } from '../../lib/classNames';
import { NAV_ITEMS } from '../../lib/navItems';
import { useMobileMenuStore } from '../../store/mobileMenuStore';
import MoreMenu, { MORE_MENU_ID } from './MoreMenu';

// The pages used most, in the order they appear in the bar. Everything else
// is one tap away behind "More".
const BOTTOM_NAV_PATHS = ['/', '/tasks', '/vital', '/statistics'];

const SLOT_CLASSES =
  'relative m-1 flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-control text-metadata font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent';

/** Tab bar for phones: the four main pages plus "More", which opens the drawer. */
function BottomNav() {
  const { t } = useTranslation();
  const isMoreOpen = useMobileMenuStore((s) => s.isOpen);
  const setMoreOpen = useMobileMenuStore((s) => s.setOpen);
  const moreRef = useRef<HTMLButtonElement>(null);
  const items = BOTTOM_NAV_PATHS.map((path) =>
    NAV_ITEMS.find(({ to }) => to === path)
  ).filter((item): item is (typeof NAV_ITEMS)[number] => Boolean(item));

  return (
    <>
      <nav
        aria-label={t('nav.mobile')}
        className="flex shrink-0 border-t border-sidebar-border bg-sidebar pb-[env(safe-area-inset-bottom)] md:hidden print:hidden"
      >
        {items.map(({ to, labelKey, icon: Icon, end, tourId }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            data-tour={tourId}
            className={({ isActive }) =>
              mergeClassNames(
                SLOT_CLASSES,
                isActive ? 'font-bold text-accent' : 'text-sidebar-muted'
              )
            }
          >
            <Icon className="size-5" />
            <span className="max-w-full truncate px-0.5">
              {t(labelKey.replace('nav.', 'nav.short.'))}
            </span>
          </NavLink>
        ))}
        <button
          ref={moreRef}
          type="button"
          onClick={() => setMoreOpen(!isMoreOpen)}
          aria-haspopup="dialog"
          aria-expanded={isMoreOpen}
          aria-controls={MORE_MENU_ID}
          data-tour="settings-link"
          data-testid="bottom-nav-more"
          className={mergeClassNames(SLOT_CLASSES, 'text-sidebar-muted')}
        >
          <Menu className="size-5" />
          <span className="max-w-full truncate px-0.5">{t('nav.more')}</span>
        </button>
      </nav>
      <MoreMenu
        open={isMoreOpen}
        onClose={() => setMoreOpen(false)}
        triggerRef={moreRef}
      />
    </>
  );
}

export default BottomNav;
