import { RefObject } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Bell, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import IconButton from './IconButton';
import Input from './Input';
import { MOBILE_DRAWER_ID } from './MobileDrawer';

const ROUTE_TITLE_KEYS: Record<string, string> = {
  '/': 'nav.dashboard',
  '/vital': 'nav.vitalTasks',
  '/tasks': 'nav.myTasks',
  '/statistics': 'nav.statistics',
  '/settings': 'nav.settings',
  '/help': 'nav.help',
};

const LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  de: 'de-DE',
  uk: 'uk-UA',
};

type TopHeaderProps = {
  onOpenMenu?: () => void;
  menuButtonRef?: RefObject<HTMLButtonElement>;
  isMenuOpen?: boolean;
};

function TopHeader({ onOpenMenu, menuButtonRef, isMenuOpen }: TopHeaderProps) {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const title = t(ROUTE_TITLE_KEYS[pathname] ?? 'nav.dashboard');

  const locale =
    LOCALE_MAP[i18n.language] ??
    LOCALE_MAP[i18n.language.split('-')[0]] ??
    'en-US';
  const today = new Date();
  const dayName = today.toLocaleDateString(locale, { weekday: 'long' });
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  const dateStr = `${day}/${month}/${year}`;

  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-default bg-surface px-content-mobile py-3 md:gap-4 md:px-content-tablet md:py-4 lg:px-content-desktop lg:py-5">
      {onOpenMenu && (
        <IconButton
          ref={menuButtonRef}
          size="menu"
          ariaLabel={t('header.openMenu')}
          ariaExpanded={isMenuOpen}
          ariaControls={MOBILE_DRAWER_ID}
          onClick={onOpenMenu}
          className="md:hidden"
        >
          <Menu className="size-4" />
        </IconButton>
      )}

      <div className="min-w-0">
        <h2 className="truncate text-title-mobile font-bold tracking-heading text-primary md:text-title-tablet lg:text-title-desktop">
          {title}
        </h2>
        <p className="truncate font-mono text-small text-muted">
          {dayName}, {dateStr}
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <IconButton ariaLabel={t('header.search')} className="lg:hidden">
          <Search className="size-4" />
        </IconButton>
        <div className="hidden lg:block lg:w-search-desktop">
          <Input
            type="text"
            placeholder={t('header.searchPlaceholder')}
            ariaLabel={t('header.search')}
            inputTestId="header-search"
          />
        </div>
        <div className="relative md:hidden lg:inline-flex">
          <IconButton ariaLabel={t('header.notifications')}>
            <Bell className="size-4" />
          </IconButton>
          <span
            aria-hidden="true"
            className="absolute right-0.5 top-0.5 size-2 rounded-full bg-notification-dot ring-2 ring-surface"
          />
        </div>
      </div>
    </header>
  );
}

export default TopHeader;
