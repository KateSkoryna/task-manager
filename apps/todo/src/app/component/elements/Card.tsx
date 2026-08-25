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
  nested: 'rounded-inner border border-default bg-surface-subtle p-3',
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
  // Selected and default states each own a single shadow utility so they
  // never compete for the same --tw-shadow variable at once.
  const shadowClass = selected
    ? 'shadow-selected'
    : variant === 'primary'
    ? 'shadow-card'
    : '';
  return (
    <div
      className={mergeClassNames(
        VARIANT_CLASSES[variant],
        shadowClass,
        selected && 'border-l-4 border-l-accent',
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
