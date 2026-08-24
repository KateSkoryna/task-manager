import { useLocation } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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

function TopHeader() {
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
    <header className="h-24 flex items-center gap-4 bg-base-bg shadow-[0px_4px_12px_rgba(0,0,0,0.1)] shrink-0">
      <div className="w-64 shrink-0 flex items-center justify-center px-6">
        <h2 className="text-xl font-bold text-dark-bg">{title}</h2>
      </div>

      <div className="flex-1 flex justify-center pr-6">
        <div className="flex items-center gap-2 w-full max-w-xl">
          <input
            type="text"
            placeholder={t('header.searchPlaceholder')}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-sm text-dark-bg placeholder:text-secondary-dark-bg focus:outline-none shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
          />
          <button
            aria-label="Search"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-triadic-orange text-white shadow-[0_2px_8px_rgba(235,138,74,0.4)] hover:opacity-90 transition-opacity shrink-0"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 pr-6">
        <button
          aria-label="Notifications"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-triadic-orange text-white hover:opacity-90 transition-opacity"
        >
          <Bell className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center leading-tight">
          <span className="text-sm font-bold text-dark-bg">{dayName}</span>
          <span className="text-sm font-semibold text-triadic-blue">
            {dateStr}
          </span>
        </div>
      </div>
    </header>
  );
}

export default TopHeader;
