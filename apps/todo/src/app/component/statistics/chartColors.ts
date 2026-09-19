// Recharts requires resolved color strings, not Tailwind classes, so these
// read our theme tokens via the rgb(var(--color-x)) form rather than
// hardcoding hex — see guideline §4.6 on raw-value consumers.
export const CHART_COLORS = {
  completed: 'rgb(var(--color-status-complete))',
  unfinished: 'rgb(var(--color-status-progress))',
  planned: 'rgb(var(--color-primary) / 0.55)',
  high: 'rgb(var(--color-status-open))',
  grid: 'rgb(var(--color-default))',
};

export const TOOLTIP_STYLE = {
  borderRadius: '0.5rem',
  border: '1px solid rgb(var(--color-default))',
  backgroundColor: 'rgb(var(--color-surface))',
  color: 'rgb(var(--color-primary))',
  boxShadow: 'var(--shadow-menu)',
  fontSize: 12,
};

export const AXIS_TICK_STYLE = {
  fontSize: 11,
  fill: 'rgb(var(--color-muted))',
};
