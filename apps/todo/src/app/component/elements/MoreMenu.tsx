import { useEffect, useRef, RefObject } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { NAV_ITEMS } from '../../lib/navItems';

// The pages that are not in the tab bar.
const MORE_PATHS = ['/reports', '/settings', '/help'];

export const MORE_MENU_ID = 'more-menu';

const ROW_CLASSES =
  'flex w-full items-center gap-3 rounded-control px-3.5 py-3 text-body text-sidebar-text transition-colors hover:bg-sidebar-text/10';

type MoreMenuProps = {
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement>;
};

/** Phone menu above the tab bar: Reports, Settings, Help and logout. */
function MoreMenu({ open, onClose, triggerRef }: MoreMenuProps) {
  const { t } = useTranslation();
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open && wasOpen.current) triggerRef.current?.focus();
    wasOpen.current = open;
  }, [open, triggerRef]);

  if (!open) return null;

  const items = MORE_PATHS.map((path) =>
    NAV_ITEMS.find(({ to }) => to === path)
  ).filter((item): item is (typeof NAV_ITEMS)[number] => Boolean(item));

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 md:hidden print:hidden">
      <div
        className="absolute inset-0 bg-sidebar/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        id={MORE_MENU_ID}
        role="dialog"
        aria-modal="true"
        aria-label={t('nav.more')}
        className="absolute inset-x-3 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.5rem)] rounded-card border border-sidebar-border bg-sidebar p-2 shadow-menu"
      >
        {items.map(({ to, labelKey, icon: Icon }) => (
          <NavLink key={to} to={to} onClick={onClose} className={ROW_CLASSES}>
            <Icon className="size-4 shrink-0 text-sidebar-muted" />
            {t(labelKey)}
          </NavLink>
        ))}
        <button type="button" onClick={handleLogout} className={ROW_CLASSES}>
          <LogOut className="size-4 shrink-0 text-sidebar-muted" />
          {t('nav.logout')}
        </button>
      </div>
    </div>
  );
}

export default MoreMenu;
