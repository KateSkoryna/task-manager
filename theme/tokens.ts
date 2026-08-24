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
  priorityHighBg: string;
  priorityHighText: string;
  priorityMediumBg: string;
  priorityMediumText: string;
  priorityLow: string;
  statusComplete: string;
  statusProgress: string;
  statusOpen: string;
  danger: string;
  dangerText: string;
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
    selectedLight: string;
    selectedDark: string;
    menuLight: string;
    menuDark: string;
  };
  layout: {
    mobile: { contentPadding: string; headerPadding: string; sectionGap: string };
    tablet: {
      contentPadding: string;
      headerPadding: string;
      sectionGap: string;
      sidebarWidth: string;
    };
    desktop: {
      contentPadding: string;
      headerPadding: string;
      sectionGap: string;
      sidebarWidth: string;
      searchWidth: string;
    };
    drawerWidth: string;
  };
  size: {
    headerIconButton: string;
    mobileMenuButton: string;
    avatar: string;
    drawerAvatar: string;
    statusMarker: string;
    weekdayCellWidth: string;
    weekdayCellHeight: string;
    progressRingSmall: string;
    progressRingLarge: string;
  };
  type: {
    title: { mobile: string; tablet: string; desktop: string };
    section: { mobile: string; tablet: string; desktop: string };
    card: { mobile: string; tablet: string; desktop: string };
    body: string;
    small: string;
    metadata: string;
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
