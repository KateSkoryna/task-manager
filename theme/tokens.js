/**
 * Canonical design tokens — the single source of truth for product colors,
 * typography, spacing, radii, shadows, and responsive layout values.
 *
 * tailwind.config.js derives semantic Tailwind utilities from this file; it
 * must never redeclare a value that lives here. Plain CommonJS so Tailwind,
 * Jest, Node tooling, and app TypeScript can all read the same data without
 * a build step.
 */
const tokens = Object.freeze({
  color: Object.freeze({
    light: Object.freeze({
      background: '#F3F3EF',
      surface: '#FFFFFF',
      surfaceSubtle: '#FAFAF7',
      border: '#E4E4DE',
      text: '#22282A',
      textMuted: '#66706E',
      sidebar: '#3A464B',
      sidebarText: '#EDEFEC',
      sidebarTextMuted: '#A3ADAD',
      sidebarBorder: 'rgba(255, 255, 255, 0.12)',
      accent: '#DCF763',
      accentText: '#22282A',
      priorityHighBg: '#B4522B',
      priorityHighText: '#FFFFFF',
      priorityMediumBg: '#F1DED4',
      priorityMediumText: '#8E3B15',
      priorityLow: '#8E3B15',
      statusComplete: '#3F9A63',
      statusProgress: '#3E86C4',
      statusOpen: '#9A6BC0',
      danger: '#DC2626',
      dangerText: '#FFFFFF',
    }),
    dark: Object.freeze({
      background: '#191E1F',
      surface: '#232829',
      surfaceSubtle: '#1E2324',
      border: '#333A3B',
      text: '#EDEFEC',
      textMuted: '#8E9796',
      sidebar: '#121617',
      sidebarText: '#EDEFEC',
      sidebarTextMuted: '#8E9796',
      sidebarBorder: 'rgba(255, 255, 255, 0.10)',
      accent: '#DCF763',
      accentText: '#1A1F20',
      priorityHighBg: '#C4653A',
      priorityHighText: '#14181A',
      priorityMediumBg: '#3B2A22',
      priorityMediumText: '#E8AA87',
      priorityLow: '#E8AA87',
      statusComplete: '#6DC791',
      statusProgress: '#74B2E9',
      statusOpen: '#BC9BDF',
      danger: '#F87171',
      dangerText: '#14181A',
    }),
  }),
  font: Object.freeze({
    sans: ['DM Sans', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
    mono: ['DM Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
    weight: Object.freeze({ normal: '400', medium: '500', bold: '700' }),
  }),
  screen: Object.freeze({
    sm: '40rem',
    md: '48rem',
    lg: '64rem',
    xl: '80rem',
    '2xl': '96rem',
  }),
  radius: Object.freeze({
    control: '0.625rem',
    inner: '0.6875rem',
    card: '0.875rem',
    pill: '9999rem',
  }),
  shadow: Object.freeze({
    cardLight: '0 0.0625rem 0.125rem rgba(20, 25, 25, 0.05)',
    cardDark: '0 0.0625rem 0.125rem rgba(0, 0, 0, 0.35)',
    selectedLight: '0 0.1875rem 0.875rem rgba(20, 25, 25, 0.10)',
    selectedDark: '0 0.1875rem 0.875rem rgba(20, 25, 25, 0.50)',
    menuLight: '0 0.625rem 1.875rem rgba(20, 25, 25, 0.14)',
    menuDark: '0 0.625rem 1.875rem rgba(20, 25, 25, 0.55)',
  }),
  layout: Object.freeze({
    mobile: Object.freeze({
      contentPadding: '1rem',
      headerPadding: '0.875rem 1rem',
      sectionGap: '0.875rem',
    }),
    tablet: Object.freeze({
      contentPadding: '1.375rem',
      headerPadding: '1.125rem 1.375rem',
      sectionGap: '1.125rem',
      sidebarWidth: '15.5rem',
    }),
    desktop: Object.freeze({
      contentPadding: '1.75rem',
      headerPadding: '1.25rem 1.75rem',
      sectionGap: '1.375rem',
      sidebarWidth: '16.75rem',
      searchWidth: '21.25rem',
    }),
    drawerWidth: '17.625rem',
  }),
  size: Object.freeze({
    headerIconButton: '2.375rem',
    mobileMenuButton: '2.5rem',
    avatar: '2.75rem',
    drawerAvatar: '2.875rem',
    statusMarker: '1.125rem',
    weekdayCellWidth: '2.875rem',
    weekdayCellHeight: '3.5rem',
    progressRingSmall: '3.875rem',
    progressRingLarge: '8.25rem',
  }),
  type: Object.freeze({
    title: Object.freeze({ mobile: '1.125rem', tablet: '1.375rem', desktop: '1.5rem' }),
    section: Object.freeze({ mobile: '1.0625rem', tablet: '1.1875rem', desktop: '1.3125rem' }),
    card: Object.freeze({ mobile: '0.875rem', tablet: '0.9375rem', desktop: '1rem' }),
    body: '0.84375rem',
    small: '0.78125rem',
    metadata: '0.65625rem',
    headingLetterSpacing: '-0.005em',
  }),
  // Component aliases: values with a single, stable meaning tied to one
  // control contract rather than a raw design primitive.
  component: Object.freeze({
    badgePaddingY: '0.1875rem',
    badgePaddingX: '0.5625rem',
    touchTargetInset: '-0.1875rem',
  }),
});

module.exports = tokens;
