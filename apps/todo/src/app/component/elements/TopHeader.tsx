import { CSSProperties, RefObject, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '../../store/notificationStore';
import { mergeClassNames } from '../../lib/classNames';
import AppLogo from './AppLogo';
import IconButton from './IconButton';
import TaskSearch from './TaskSearch';
import { MOBILE_DRAWER_ID } from './MobileDrawer';
import bgImage from '../../../assets/bg.webp';

const APP_NAME = 'TaskPal';

// The same pattern the login and register pages use as their page
// background. The image is light grey line art on white, so it is multiplied
// with the header's own surface colour: the white drops out and only the
// lines remain, in the light and the dark theme alike.
const HEADER_PATTERN_STYLE: CSSProperties = {
  backgroundImage: `url(${bgImage})`,
  backgroundRepeat: 'repeat',
  backgroundSize: '800px',
  backgroundBlendMode: 'multiply',
};

const LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  de: 'de-DE',
  uk: 'uk-UA',
};

/**
 * "Tuesday, 06 October 2026". Assembled from parts rather than taken from
 * the locale's own long format so the order stays day, month, year in every
 * language (en-US would put the month first) while the month name keeps the
 * grammatical form it has next to a day number (Ukrainian "жовтня").
 */
export function formatHeaderDate(date: Date, locale: string): string {
  const parts = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  return `${part('weekday')}, ${part('day')} ${part('month')} ${part('year')}`;
}

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
  const navigate = useNavigate();

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
  const headerDate = formatHeaderDate(new Date(), locale);

  return (
    <header
      className={mergeClassNames(
        'flex shrink-0 items-center gap-3 border-b border-default bg-surface px-content-mobile py-3 md:gap-4 md:px-content-tablet md:py-4 lg:px-content-desktop lg:py-5',
        className
      )}
      style={HEADER_PATTERN_STYLE}
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

      <AppLogo className="size-10" />
      <div className="min-w-0">
        <h2 className="truncate text-title-mobile font-bold tracking-heading text-primary md:text-title-tablet lg:text-title-desktop">
          {APP_NAME}
        </h2>
        <p className="truncate font-mono text-small text-muted">{headerDate}</p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Below `lg` there is no room for the search box here; the
            dashboard shows it in its own content instead. */}
        <TaskSearch
          inputTestId="header-search"
          className="hidden lg:block lg:w-search-desktop"
        />
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
