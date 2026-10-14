// The tokens live in the workspace's `theme/` folder, outside any Nx project.
// eslint-disable-next-line @nx/enforce-module-boundaries
import tokens from '../../../../../theme/tokens';

type Palette = (typeof tokens.color)['light'];
type Token = keyof Palette;

/** WCAG 2.x relative luminance of a '#RRGGBB' color. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: string, background: string): number {
  const [a, b] = [luminance(foreground), luminance(background)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const MODES = ['light', 'dark'] as const;

// Text must reach 4.5:1 (WCAG AA). Pairs are [text color, background].
const TEXT_PAIRS: [Token, Token][] = [
  ['text', 'background'],
  ['text', 'surface'],
  ['text', 'surfaceSubtle'],
  ['textMuted', 'background'],
  ['textMuted', 'surface'],
  ['textMuted', 'surfaceSubtle'],
  ['accentText', 'accent'],
  ['actionText', 'action'],
  ['accentInk', 'surface'],
  ['danger', 'surface'],
  ['dangerText', 'danger'],
  ['sidebarText', 'sidebar'],
  ['sidebarTextMuted', 'sidebar'],
];

// Dots, borders and bars carry meaning but are not text: 3:1 is enough.
const NON_TEXT_PAIRS: [Token, Token][] = [
  ['priorityHighBg', 'surfaceSubtle'],
  ['priorityLow', 'surfaceSubtle'],
];

// Known gaps, kept on purpose. The test only stops them getting worse, so
// the floor is the lowest ratio accepted today. Raise a floor when a color
// is fixed.
const KNOWN_GAPS: [Token, Token, 'light' | 'dark', number, string][] = [
  [
    'statusComplete',
    'surfaceSubtle',
    'light',
    3,
    'status words in the light theme',
  ],
  [
    'statusProgress',
    'surfaceSubtle',
    'light',
    3,
    'status words in the light theme',
  ],
  [
    'statusOpen',
    'surfaceSubtle',
    'light',
    3,
    'status words in the light theme',
  ],
  [
    'accent',
    'surface',
    'light',
    1,
    'neon focus outline on white, kept by choice',
  ],
];

describe.each(MODES)('theme colors (%s)', (mode) => {
  const palette = tokens.color[mode];

  test.each(TEXT_PAIRS)('%s on %s reaches 4.5:1', (fg, bg) => {
    expect(contrast(palette[fg], palette[bg])).toBeGreaterThanOrEqual(4.5);
  });

  test.each(NON_TEXT_PAIRS)('%s on %s reaches 3:1', (fg, bg) => {
    expect(contrast(palette[fg], palette[bg])).toBeGreaterThanOrEqual(3);
  });

  const gaps = KNOWN_GAPS.filter(([, , m]) => m === mode);
  if (gaps.length > 0) {
    test.each(gaps)(
      '%s on %s stays above its floor of %s:1 (%s)',
      (fg, bg, _mode, floor) => {
        expect(contrast(palette[fg], palette[bg])).toBeGreaterThanOrEqual(
          floor
        );
      }
    );
  }

  // Status colors are text on the dark theme, so they must pass there.
  if (mode === 'dark') {
    test.each(['statusComplete', 'statusProgress', 'statusOpen'] as Token[])(
      '%s on surfaceSubtle reaches 4.5:1',
      (fg) => {
        expect(
          contrast(palette[fg], palette.surfaceSubtle)
        ).toBeGreaterThanOrEqual(4.5);
      }
    );
  }
});
