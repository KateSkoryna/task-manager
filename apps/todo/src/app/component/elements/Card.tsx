import { mergeClassNames } from '../../lib/classNames';

type CardProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'nested';
  selected?: boolean;
  className?: string;
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
    >
      {children}
    </div>
  );
}

export default Card;
