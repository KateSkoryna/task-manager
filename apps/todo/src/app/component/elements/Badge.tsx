import { mergeClassNames } from '../../lib/classNames';

type BadgeTone =
  | 'priority-high'
  | 'priority-medium'
  | 'priority-low'
  | 'neutral';

type BadgeProps = {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
};

// Priority is a coloured dot followed by its label, so colour is never the
// only cue. The strongest colour is the most important: high is solid and darkest, medium
// a ring with a dot in a lighter shade, low an empty and lightest ring.
const DOT_CLASSES: Partial<Record<BadgeTone, string>> = {
  'priority-high': 'bg-priority-low',
  'priority-medium':
    'border-2 border-priority-high-bg bg-priority-high-bg bg-clip-content p-px',
  'priority-low': 'border-2 border-priority-high-bg/50',
};

function Badge({ children, tone = 'neutral', className = '' }: BadgeProps) {
  const dotClasses = DOT_CLASSES[tone];
  if (dotClasses) {
    return (
      <span
        className={mergeClassNames(
          'inline-flex items-center gap-1.5 text-small text-muted',
          className
        )}
      >
        <span
          aria-hidden="true"
          className={mergeClassNames(
            'size-2.5 shrink-0 rounded-pill',
            dotClasses
          )}
        />
        {children}
      </span>
    );
  }
  return (
    <span
      className={mergeClassNames(
        'inline-flex items-center rounded-pill border border-default bg-surface-subtle px-badge-x py-badge-y text-metadata font-medium text-muted',
        className
      )}
    >
      {children}
    </span>
  );
}

export default Badge;
