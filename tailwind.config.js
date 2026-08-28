/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');
const tokens = require('./theme/tokens');
const legacyColors = require('./theme/colors');

/** '#RRGGBB' -> 'R G B' decimal channels, for rgb(var(--x) / <alpha-value>) */
function hexToRgbChannels(hex) {
  const value = hex.replace('#', '');
  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);
  return `${r} ${g} ${b}`;
}

/** '0.875rem 1rem' -> { y: '0.875rem', x: '1rem' } */
function parsePadding(shorthand) {
  const [y, x] = shorthand.split(' ');
  return { y, x };
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
  'priority-high-bg': 'priorityHighBg',
  'priority-high-text': 'priorityHighText',
  'priority-medium-bg': 'priorityMediumBg',
  'priority-medium-text': 'priorityMediumText',
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
  selected: { light: 'selectedLight', dark: 'selectedDark' },
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

const desktopHeaderPadding = parsePadding(tokens.layout.desktop.headerPadding);
const tabletHeaderPadding = parsePadding(tokens.layout.tablet.headerPadding);
const mobileHeaderPadding = parsePadding(tokens.layout.mobile.headerPadding);

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
      colors: { ...legacyColors, ...semanticColors },
      fontFamily: {
        sans: tokens.font.sans,
        mono: tokens.font.mono,
      },
      fontSize: {
        'title-mobile': tokens.type.title.mobile,
        'title-tablet': tokens.type.title.tablet,
        'title-desktop': tokens.type.title.desktop,
        'section-mobile': tokens.type.section.mobile,
        'section-tablet': tokens.type.section.tablet,
        'section-desktop': tokens.type.section.desktop,
        'card-mobile': tokens.type.card.mobile,
        'card-tablet': tokens.type.card.tablet,
        'card-desktop': tokens.type.card.desktop,
        body: tokens.type.body,
        small: tokens.type.small,
        metadata: tokens.type.metadata,
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
        selected: 'var(--shadow-selected)',
        menu: 'var(--shadow-menu)',
      },
      spacing: {
        'content-mobile': tokens.layout.mobile.contentPadding,
        'content-tablet': tokens.layout.tablet.contentPadding,
        'content-desktop': tokens.layout.desktop.contentPadding,
        'section-gap-mobile': tokens.layout.mobile.sectionGap,
        'section-gap-tablet': tokens.layout.tablet.sectionGap,
        'section-gap-desktop': tokens.layout.desktop.sectionGap,
        'header-y-mobile': mobileHeaderPadding.y,
        'header-x-mobile': mobileHeaderPadding.x,
        'header-y-tablet': tabletHeaderPadding.y,
        'header-x-tablet': tabletHeaderPadding.x,
        'header-y-desktop': desktopHeaderPadding.y,
        'header-x-desktop': desktopHeaderPadding.x,
        'badge-y': tokens.component.badgePaddingY,
        'badge-x': tokens.component.badgePaddingX,
        'touch-target-inset': tokens.component.touchTargetInset,
      },
      width: {
        'sidebar-tablet': tokens.layout.tablet.sidebarWidth,
        'sidebar-desktop': tokens.layout.desktop.sidebarWidth,
        drawer: tokens.layout.drawerWidth,
        'search-desktop': tokens.layout.desktop.searchWidth,
        'weekday-cell': tokens.size.weekdayCellWidth,
      },
      height: {
        'weekday-cell': tokens.size.weekdayCellHeight,
      },
      size: {
        'header-action': tokens.size.headerIconButton,
        'menu-button': tokens.size.mobileMenuButton,
        avatar: tokens.size.avatar,
        'avatar-drawer': tokens.size.drawerAvatar,
        'status-marker': tokens.size.statusMarker,
        'ring-sm': tokens.size.progressRingSmall,
        'ring-lg': tokens.size.progressRingLarge,
      },
    },
  },
  plugins: [themeVariablesPlugin],
};
