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
};

/**
 * Bordered neutral icon-only control. The visible box matches the design's
 * 2.375rem size; a transparent pseudo-element pads the actual hit area out
 * to the 2.75rem touch-target minimum without changing what's drawn.
 */
function IconButton({
  children,
  ariaLabel,
  onClick,
  active,
  disabled = false,
  type = 'button',
  className = '',
  dataTestId,
}: IconButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      disabled={disabled}
      data-testid={dataTestId}
      className={mergeClassNames(
        "relative inline-flex size-header-action shrink-0 items-center justify-center rounded-control border transition-colors before:absolute before:inset-touch-target-inset before:content-[''] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50",
        active
          ? 'border-accent bg-accent text-on-accent'
          : 'border-default bg-surface text-muted hover:bg-surface-subtle',
        className
      )}
    >
      {children}
    </button>
  );
}

export default IconButton;
