import { forwardRef } from 'react';
import { mergeClassNames } from '../../lib/classNames';

type IconButtonProps = {
  children: React.ReactNode;
  ariaLabel: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Omit for a plain action button; pass true/false only for a real toggle. */
  active?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
  dataTestId?: string;
  /** 'menu' matches the mobile drawer's 2.5rem trigger; default is 2.375rem. */
  size?: 'default' | 'menu';
  /** For a control that opens/closes a panel, e.g. the mobile menu button. */
  ariaExpanded?: boolean;
  ariaControls?: string;
  /**
   * 'sidebar' matches the dark sidebar/drawer surface it sits on instead of
   * the light header surface. Swapped in, not appended via `className` —
   * Tailwind's compiled utility order doesn't follow theme-key insertion
   * order, so a later class in the string isn't guaranteed to win.
   */
  tone?: 'surface' | 'sidebar';
};

/**
 * Bordered neutral icon-only control. The visible box matches the design's
 * 2.375rem size; a transparent pseudo-element pads the actual hit area out
 * to the 2.75rem touch-target minimum without changing what's drawn.
 */
const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      children,
      ariaLabel,
      onClick,
      active,
      disabled = false,
      type = 'button',
      className = '',
      dataTestId,
      size = 'default',
      ariaExpanded,
      ariaControls,
      tone = 'surface',
    },
    ref
  ) => {
    // sidebar-text is the same light value in both themes, and the sidebar
    // background is dark in both — so a translucent light tint over it reads
    // as the same frosted "glass" layer regardless of theme, instead of
    // flipping to a flat solid or a stark white square.
    const toneClasses =
      tone === 'sidebar'
        ? 'border-sidebar-border bg-sidebar-text/10 text-sidebar-text backdrop-blur-sm hover:bg-sidebar-text/20'
        : 'border-default bg-surface text-muted hover:bg-surface-subtle';

    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        aria-label={ariaLabel}
        aria-pressed={active}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        disabled={disabled}
        data-testid={dataTestId}
        className={mergeClassNames(
          "relative inline-flex shrink-0 items-center justify-center rounded-control border transition-colors before:absolute before:inset-touch-target-inset before:content-[''] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50",
          size === 'menu' ? 'size-menu-button' : 'size-header-action',
          active ? 'border-accent bg-accent text-on-accent' : toneClasses,
          className
        )}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export default IconButton;
