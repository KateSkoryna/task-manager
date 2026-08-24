import { useEffect, useRef, RefObject } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SidebarContent from './SidebarContent';
import IconButton from './IconButton';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Tailwind's `md` breakpoint (tokens.screen.md) — kept as a literal here
// since matchMedia needs a real media-query string, not a class name.
const TABLET_QUERY = '(min-width: 48rem)';

export const MOBILE_DRAWER_ID = 'mobile-nav-drawer';

type MobileDrawerProps = {
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement>;
};

/**
 * Off-canvas navigation for mobile. Traps focus and locks background scroll
 * while open; Escape, the overlay, a nav choice, or logout all close it.
 * Focus returns to the menu button that opened it. Also self-closes if the
 * viewport crosses into the tablet/desktop persistent-sidebar breakpoint
 * while open (e.g. rotation or a DevTools resize).
 */
function MobileDrawer({ open, onClose, triggerRef }: MobileDrawerProps) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  // Read via a ref inside the trap effect so identity churn on `onClose`
  // (a fresh inline function on every parent render) doesn't tear down and
  // rebuild the listener — that rebuild was re-running the initial-focus
  // step and yanking focus back to the close button mid-navigation.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    const focusable = panel
      ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      : [];
    focusable[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const mediaQuery = window.matchMedia(TABLET_QUERY);
    const handleChange = () => {
      if (mediaQuery.matches) onCloseRef.current();
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [open]);

  useEffect(() => {
    if (!open && wasOpen.current) triggerRef.current?.focus();
    wasOpen.current = open;
  }, [open, triggerRef]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <div
        className="absolute inset-0 bg-sidebar/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        id={MOBILE_DRAWER_ID}
        role="dialog"
        aria-modal="true"
        aria-label={t('header.menuTitle')}
        className="absolute inset-y-0 left-0 flex w-drawer flex-col bg-sidebar shadow-menu"
      >
        <div className="flex justify-end px-3 pt-3">
          <IconButton
            size="menu"
            tone="sidebar"
            ariaLabel={t('header.closeMenu')}
            onClick={onClose}
          >
            <X className="size-4" />
          </IconButton>
        </div>
        <SidebarContent avatarSize="drawer" onNavigate={onClose} />
      </div>
    </div>
  );
}

export default MobileDrawer;
