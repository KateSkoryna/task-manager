/// <reference types="node" />

export type ThemeMode = 'light' | 'dark';

export interface ColorTokens {
  background: string;
  surface: string;
  surfaceSubtle: string;
  border: string;
  text: string;
  textMuted: string;
  sidebar: string;
  sidebarText: string;
  sidebarTextMuted: string;
  sidebarBorder: string;
  accent: string;
  accentText: string;
  action: string;
  actionText: string;
  accentInk: string;
  priorityHighBg: string;
  priorityLow: string;
  statusComplete: string;
  statusProgress: string;
  statusOpen: string;
  danger: string;
  dangerText: string;
  notificationDot: string;
}

export interface Tokens {
  color: Record<ThemeMode, ColorTokens>;
  font: {
    sans: string[];
    mono: string[];
    weight: { normal: string; medium: string; bold: string };
  };
  screen: { sm: string; md: string; lg: string; xl: string; '2xl': string };
  radius: { control: string; inner: string; card: string; pill: string };
  shadow: {
    cardLight: string;
    cardDark: string;
    menuLight: string;
    menuDark: string;
  };
  layout: {
    mobile: {
      contentPadding: string;
    };
    tablet: {
      contentPadding: string;
      sidebarWidth: string;
    };
    desktop: {
      contentPadding: string;
      sidebarWidth: string;
      searchWidth: string;
    };
  };
  size: {
    headerIconButton: string;
    mobileMenuButton: string;
    avatar: string;
  };
  type: {
    title: { mobile: string; tablet: string; desktop: string };
    card: { mobile: string };
    body: string;
    small: string;
    metadata: string;
    control: string;
    headingLetterSpacing: string;
  };
  component: {
    badgePaddingY: string;
    badgePaddingX: string;
    touchTargetInset: string;
  };
}

const tokens = require('./tokens.js') as Tokens;

export default tokens;
