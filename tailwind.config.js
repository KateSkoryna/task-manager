/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');
const tokens = require('./theme/tokens');

/** '#RRGGBB' -> 'R G B' decimal channels, for rgb(var(--x) / <alpha-value>) */
function hexToRgbChannels(hex) {
  const value = hex.replace('#', '');
  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);
  return `${r} ${g} ${b}`;
}

// Semantic color name -> token key. Values are hex and get split into RGB
// channels so Tailwind's rgb(var(--x) / <alpha-value>) opacity modifiers work.
const CHANNEL_COLOR_TOKENS = {
  app: 'background',
  surface: 'surface',
  'surface-subtle': 'surfaceSubtle',
  default: 'border',
  primary: 'text',
  muted: 'textMuted',
  sidebar: 'sidebar',
  'sidebar-text': 'sidebarText',
  'sidebar-muted': 'sidebarTextMuted',
  accent: 'accent',
  'on-accent': 'accentText',
  action: 'action',
  'on-action': 'actionText',
  'accent-ink': 'accentInk',
  'priority-high-bg': 'priorityHighBg',
  'priority-low': 'priorityLow',
  'status-complete': 'statusComplete',
  'status-progress': 'statusProgress',
  'status-open': 'statusOpen',
  danger: 'danger',
  'danger-text': 'dangerText',
  'notification-dot': 'notificationDot',
};

// sidebarBorder ships pre-composed with alpha (rgba(...)) and is passed
// through as-is; it does not support the <alpha-value> opacity modifier.
const PASSTHROUGH_COLOR_TOKENS = {
  'sidebar-border': 'sidebarBorder',
};

const SHADOW_TOKENS = {
  card: { light: 'cardLight', dark: 'cardDark' },
  menu: { light: 'menuLight', dark: 'menuDark' },
};

const semanticColors = Object.fromEntries(
  Object.keys(CHANNEL_COLOR_TOKENS)
    .map((name) => [name, `rgb(var(--color-${name}) / <alpha-value>)`])
    .concat(
      Object.keys(PASSTHROUGH_COLOR_TOKENS).map((name) => [
        name,
        `var(--color-${name})`,
      ])
    )
);

/** Emits :root and [data-theme='dark'] custom properties from tokens.color. */
const themeVariablesPlugin = plugin(({ addBase }) => {
  const toDeclarations = (mode) => {
    const palette = tokens.color[mode];
    const declarations = {};
    for (const [name, tokenKey] of Object.entries(CHANNEL_COLOR_TOKENS)) {
      declarations[`--color-${name}`] = hexToRgbChannels(palette[tokenKey]);
    }
    for (const [name, tokenKey] of Object.entries(PASSTHROUGH_COLOR_TOKENS)) {
      declarations[`--color-${name}`] = palette[tokenKey];
    }
    return declarations;
  };

  const toShadowDeclarations = (mode) => {
    const declarations = {};
    for (const [name, byMode] of Object.entries(SHADOW_TOKENS)) {
      declarations[`--shadow-${name}`] = tokens.shadow[byMode[mode]];
    }
    return declarations;
  };

  addBase({
    ':root': { ...toDeclarations('light'), ...toShadowDeclarations('light') },
    ":root[data-theme='dark']": {
      ...toDeclarations('dark'),
      ...toShadowDeclarations('dark'),
    },
  });
});

module.exports = {
  content: ['./apps/todo/src/**/*.{js,jsx,ts,tsx,html}'],
  theme: {
    screens: tokens.screen,
    extend: {
      colors: semanticColors,
      fontFamily: {
        sans: tokens.font.sans,
        mono: tokens.font.mono,
      },
      fontSize: {
        'title-mobile': tokens.type.title.mobile,
        'title-tablet': tokens.type.title.tablet,
        'title-desktop': tokens.type.title.desktop,
        'card-mobile': tokens.type.card.mobile,
        body: tokens.type.body,
        small: tokens.type.small,
        metadata: tokens.type.metadata,
        control: tokens.type.control,
      },
      letterSpacing: {
        heading: tokens.type.headingLetterSpacing,
      },
      borderRadius: {
        control: tokens.radius.control,
        inner: tokens.radius.inner,
        card: tokens.radius.card,
        pill: tokens.radius.pill,
      },
      // tokens.shadow.* values are already complete box-shadow strings
      // (offset, blur, and color), so the CSS variables hold the full
      // value — these must not add another offset/blur wrapper around them.
      boxShadow: {
        card: 'var(--shadow-card)',
        menu: 'var(--shadow-menu)',
      },
      spacing: {
        'content-mobile': tokens.layout.mobile.contentPadding,
        'content-tablet': tokens.layout.tablet.contentPadding,
        'content-desktop': tokens.layout.desktop.contentPadding,
        'badge-y': tokens.component.badgePaddingY,
        'badge-x': tokens.component.badgePaddingX,
        'touch-target-inset': tokens.component.touchTargetInset,
      },
      width: {
        'sidebar-tablet': tokens.layout.tablet.sidebarWidth,
        'sidebar-desktop': tokens.layout.desktop.sidebarWidth,
        'search-desktop': tokens.layout.desktop.searchWidth,
      },
      size: {
        'header-action': tokens.size.headerIconButton,
        'menu-button': tokens.size.mobileMenuButton,
        avatar: tokens.size.avatar,
      },
      // Color-only animation for a busy control whose label doesn't change —
      // no size/position properties, so it never causes layout shift.
      keyframes: {
        'border-pulse': {
          '0%, 100%': { borderColor: 'rgb(var(--color-accent-ink))' },
          '50%': { borderColor: 'rgb(var(--color-default))' },
        },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      animation: {
        'border-pulse': 'border-pulse 1.2s ease-in-out infinite',
        'fade-in': 'fade-in 200ms ease-out',
      },
    },
  },
  plugins: [themeVariablesPlugin],
};
