import { mergeClassNames } from '../../lib/classNames';

type BadgeTone = 'priority-high' | 'priority-medium' | 'priority-low' | 'neutral';

type BadgeProps = {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
};

const TONE_CLASSES: Record<BadgeTone, string> = {
  'priority-high': 'bg-priority-high-bg text-priority-high-text',
  'priority-medium': 'bg-priority-medium-bg text-priority-medium-text',
  'priority-low': 'border border-priority-low text-priority-low bg-transparent',
  neutral: 'border border-default text-muted bg-surface-subtle',
};

function Badge({ children, tone = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={mergeClassNames(
        'inline-flex items-center rounded-pill px-badge-x py-badge-y text-metadata font-medium',
        TONE_CLASSES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export default Badge;
