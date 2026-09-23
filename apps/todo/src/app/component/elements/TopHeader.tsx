import { RefObject, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Loader2, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHeaderTaskSearch } from '../../hooks/useHeaderTaskSearch';
import { useNotificationStore } from '../../store/notificationStore';
import { mergeClassNames } from '../../lib/classNames';
import IconButton from './IconButton';
import SearchInput from './SearchInput';
import { MOBILE_DRAWER_ID } from './MobileDrawer';

const ROUTE_TITLE_KEYS: Record<string, string> = {
  '/': 'nav.dashboard',
  '/vital': 'nav.vitalTasks',
  '/tasks': 'nav.myTasks',
  '/statistics': 'nav.statistics',
  '/reports': 'nav.reports',
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
  className?: string;
};

function TopHeader({
  onOpenMenu,
  menuButtonRef,
  isMenuOpen,
  className,
}: TopHeaderProps) {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const titleKey = pathname.startsWith('/reports/')
    ? 'nav.reports'
    : ROUTE_TITLE_KEYS[pathname] ?? 'nav.dashboard';
  const title = t(titleKey);

  const { query, setQuery, status, matches, clear } = useHeaderTaskSearch();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const isSearchOpen = query.trim().length > 0;

  useEffect(() => {
    if (!isSearchOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!searchContainerRef.current?.contains(event.target as Node)) {
        clear();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSearchOpen]);

  const notifications = useNotificationStore((s) => s.notifications);
  const markNotificationRead = useNotificationStore((s) => s.markRead);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isNotificationsOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!notificationsContainerRef.current?.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isNotificationsOpen]);

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
    <header
      className={mergeClassNames(
        'flex shrink-0 items-center gap-3 border-b border-default bg-surface px-content-mobile py-3 md:gap-4 md:px-content-tablet md:py-4 lg:px-content-desktop lg:py-5',
        className
      )}
    >
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
        <div
          ref={searchContainerRef}
          className="relative hidden lg:block lg:w-search-desktop"
        >
          <SearchInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') clear();
            }}
            placeholder={t('header.searchPlaceholder')}
            ariaLabel={t('header.search')}
            inputTestId="header-search"
          />

          {isSearchOpen && (
            <ul
              role="listbox"
              aria-label={t('header.search')}
              className="absolute z-10 mt-1 w-full list-none overflow-hidden rounded-inner border-2 border-default bg-surface p-0 shadow-menu"
            >
              {status === 'loading' && (
                <li className="flex items-center gap-2 px-3 py-2 text-sm text-muted">
                  <Loader2 className="size-4 animate-spin" />
                  {t('header.searchLoading')}
                </li>
              )}
              {status === 'error' && (
                <li className="px-3 py-2 text-sm text-danger">
                  {t('header.searchError')}
                </li>
              )}
              {status === 'success' && matches.length === 0 && (
                <li className="px-3 py-2 text-sm text-muted">
                  {t('header.searchNoResults')}
                </li>
              )}
              {status === 'success' &&
                matches.map((match) => (
                  <li key={match.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      onClick={() => {
                        navigate('/tasks', {
                          state: { todoId: match.id, listId: match.todolistId },
                        });
                        clear();
                      }}
                      className="w-full truncate px-3 py-2 text-left text-sm text-primary hover:bg-surface-subtle focus:bg-surface-subtle focus:outline-none"
                    >
                      {match.name}
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>
        <div className="relative" ref={notificationsContainerRef}>
          <IconButton
            ariaLabel={t('header.notifications')}
            onClick={() => setNotificationsOpen((open) => !open)}
          >
            <Bell className="size-4" />
          </IconButton>
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute right-2 top-2 size-2 rounded-full bg-notification-dot ring-2 ring-surface"
            />
          )}

          {isNotificationsOpen && (
            <ul
              role="listbox"
              aria-label={t('header.notifications')}
              className="absolute right-0 z-50 mt-1 max-h-80 w-72 list-none overflow-y-auto rounded-inner border-2 border-default bg-surface p-0 shadow-menu"
            >
              {notifications.length === 0 && (
                <li className="px-3 py-2 text-sm text-muted">
                  {t('header.noNotifications')}
                </li>
              )}
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={false}
                    onClick={() => {
                      markNotificationRead(notification.id);
                      setNotificationsOpen(false);
                      navigate(`/reports/${notification.reportId}`);
                    }}
                    className={mergeClassNames(
                      'flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-surface-subtle focus:bg-surface-subtle focus:outline-none',
                      notification.read
                        ? 'text-muted'
                        : 'font-medium text-primary'
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={mergeClassNames(
                        'mt-1.5 size-2 shrink-0 rounded-full',
                        notification.read ? 'bg-transparent' : 'bg-accent'
                      )}
                    />
                    <span className="whitespace-normal break-words">
                      {notification.message}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopHeader;
