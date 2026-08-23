import { mergeClassNames } from '../../lib/classNames';

type ButtonVariant = 'primary' | 'secondary' | 'destructive';

type ButtonProps = {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  dataTestId?: string;
};

// Applied only when a caller opts in via `variant`; omitting it keeps the
// legacy pass-through behavior for callers that supply their own className.
const BASE_BUTTON_CLASSES =
  'inline-flex items-center justify-center gap-2 rounded-control px-4 py-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-accent font-bold text-on-accent hover:brightness-95 active:brightness-90 focus-visible:outline-accent',
  secondary:
    'border border-default bg-surface font-medium text-primary hover:bg-surface-subtle active:bg-surface-subtle focus-visible:outline-accent',
  destructive:
    'bg-danger font-bold text-danger-text hover:brightness-95 active:brightness-90 focus-visible:outline-danger',
};

const Button: React.FC<ButtonProps> = ({
  onClick,
  className = '',
  children,
  type = 'button',
  disabled = false,
  loading = false,
  variant,
  dataTestId,
}) => {
  const resolvedClassName = variant
    ? mergeClassNames(BASE_BUTTON_CLASSES, VARIANT_CLASSES[variant], className)
    : className;
  return (
    <button
      type={type}
      onClick={onClick}
      className={resolvedClassName}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-testid={dataTestId}
    >
      {children}
    </button>
  );
};

export default Button;
