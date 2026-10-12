import { mergeClassNames } from '../../lib/classNames';

type CardProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'nested';
  selected?: boolean;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  role?: string;
  tabIndex?: number;
  dataTestId?: string;
};

const VARIANT_CLASSES: Record<NonNullable<CardProps['variant']>, string> = {
  primary: 'rounded-card border border-default bg-surface p-4',
  nested:
    'rounded-inner border border-default bg-surface-subtle p-3 transition-colors hover:border-muted',
};

function Card({
  children,
  variant = 'primary',
  selected = false,
  className = '',
  onClick,
  onKeyDown,
  role,
  tabIndex,
  dataTestId,
}: CardProps) {
  return (
    <div
      className={mergeClassNames(
        VARIANT_CLASSES[variant],
        selected && 'shadow-[inset_4px_0_0_rgb(var(--color-accent))]',
        className
      )}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role={role}
      tabIndex={tabIndex}
      data-testid={dataTestId}
    >
      {children}
    </div>
  );
}

export default Card;
