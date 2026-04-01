/**
 * JAY Design System — Apple iOS Native
 *
 * Exact iOS system colors, SF Pro typography scale, and semantic tokens.
 * Supports light/dark mode via the useTheme() hook.
 *
 * Sources:
 * - Apple HIG: https://developer.apple.com/design/human-interface-guidelines/
 * - iOS system colors: https://noahgilmore.com/blog/dark-mode-uicolor-compatibility
 * - iOS typography: https://gist.github.com/zacwest/916d31da5d03405809c4
 */

// ══════════════════════════════════════════════════════════════════════════════
// iOS SYSTEM COLORS — exact values from Apple HIG
// ══════════════════════════════════════════════════════════════════════════════

export const iOS = {
  light: {
    // Backgrounds
    systemBackground: '#FFFFFF',
    secondarySystemBackground: '#F2F2F7',
    tertiarySystemBackground: '#FFFFFF',
    groupedBackground: '#F2F2F7',
    secondaryGroupedBackground: '#FFFFFF',

    // Labels
    label: '#000000',
    secondaryLabel: 'rgba(60, 60, 67, 0.6)',
    tertiaryLabel: 'rgba(60, 60, 67, 0.3)',
    quaternaryLabel: 'rgba(60, 60, 67, 0.18)',
    placeholderText: 'rgba(60, 60, 67, 0.3)',

    // Separators
    separator: 'rgba(60, 60, 67, 0.29)',
    opaqueSeparator: '#C6C6C8',

    // Fills
    systemFill: 'rgba(120, 120, 128, 0.2)',
    secondarySystemFill: 'rgba(120, 120, 128, 0.16)',
    tertiarySystemFill: 'rgba(118, 118, 128, 0.12)',
    quaternarySystemFill: 'rgba(116, 116, 128, 0.08)',

    // System tints
    systemBlue: '#007AFF',
    systemGreen: '#34C759',
    systemIndigo: '#5856D6',
    systemOrange: '#FF9500',
    systemPink: '#FF2D55',
    systemPurple: '#AF52DE',
    systemRed: '#FF3B30',
    systemTeal: '#5AC8FA',
    systemYellow: '#FFCC00',
    systemMint: '#00C7BE',
    systemCyan: '#32ADE6',
    systemBrown: '#A2845E',

    // Grays
    systemGray: '#8E8E93',
    systemGray2: '#AEAEB2',
    systemGray3: '#C7C7CC',
    systemGray4: '#D1D1D6',
    systemGray5: '#E5E5EA',
    systemGray6: '#F2F2F7',
  },

  dark: {
    // Backgrounds
    systemBackground: '#000000',
    secondarySystemBackground: '#1C1C1E',
    tertiarySystemBackground: '#2C2C2E',
    groupedBackground: '#000000',
    secondaryGroupedBackground: '#1C1C1E',

    // Labels
    label: '#FFFFFF',
    secondaryLabel: 'rgba(235, 235, 245, 0.6)',
    tertiaryLabel: 'rgba(235, 235, 245, 0.3)',
    quaternaryLabel: 'rgba(235, 235, 245, 0.18)',
    placeholderText: 'rgba(235, 235, 245, 0.3)',

    // Separators
    separator: 'rgba(84, 84, 88, 0.6)',
    opaqueSeparator: '#38383A',

    // Fills
    systemFill: 'rgba(120, 120, 128, 0.36)',
    secondarySystemFill: 'rgba(120, 120, 128, 0.32)',
    tertiarySystemFill: 'rgba(118, 118, 128, 0.24)',
    quaternarySystemFill: 'rgba(118, 118, 128, 0.18)',

    // System tints (brighter for dark backgrounds)
    systemBlue: '#0A84FF',
    systemGreen: '#30D158',
    systemIndigo: '#5E5CE6',
    systemOrange: '#FF9F0A',
    systemPink: '#FF375F',
    systemPurple: '#BF5AF2',
    systemRed: '#FF453A',
    systemTeal: '#64D2FF',
    systemYellow: '#FFD60A',
    systemMint: '#63E6E2',
    systemCyan: '#40CBE0',
    systemBrown: '#AC8E68',

    // Grays (inverted — darker values for dark mode)
    systemGray: '#8E8E93',
    systemGray2: '#636366',
    systemGray3: '#48484A',
    systemGray4: '#3A3A3C',
    systemGray5: '#2C2C2E',
    systemGray6: '#1C1C1E',
  },
} as const;

// ══════════════════════════════════════════════════════════════════════════════
// TYPOGRAPHY — iOS SF Pro scale (using Outfit as custom font)
// ══════════════════════════════════════════════════════════════════════════════

export const TYPE = {
  largeTitle:  { fontSize: 34, fontWeight: '700' as const, letterSpacing: 0.37, fontFamily: 'Outfit-Bold' },
  title1:      { fontSize: 28, fontWeight: '700' as const, letterSpacing: 0.36, fontFamily: 'Outfit-Bold' },
  title2:      { fontSize: 22, fontWeight: '700' as const, letterSpacing: 0.35, fontFamily: 'Outfit-Bold' },
  title3:      { fontSize: 20, fontWeight: '600' as const, letterSpacing: 0.38, fontFamily: 'Outfit-SemiBold' },
  headline:    { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.41, fontFamily: 'Outfit-SemiBold' },
  body:        { fontSize: 17, fontWeight: '400' as const, letterSpacing: -0.41, lineHeight: 22, fontFamily: 'Outfit' },
  callout:     { fontSize: 16, fontWeight: '400' as const, letterSpacing: -0.32, lineHeight: 21, fontFamily: 'Outfit' },
  subheadline: { fontSize: 15, fontWeight: '400' as const, letterSpacing: -0.24, lineHeight: 20, fontFamily: 'Outfit' },
  footnote:    { fontSize: 13, fontWeight: '400' as const, letterSpacing: -0.08, lineHeight: 18, fontFamily: 'Outfit' },
  caption1:    { fontSize: 12, fontWeight: '400' as const, letterSpacing: 0, lineHeight: 16, fontFamily: 'Outfit' },
  caption2:    { fontSize: 11, fontWeight: '400' as const, letterSpacing: 0.07, lineHeight: 13, fontFamily: 'Outfit' },
} as const;

// ══════════════════════════════════════════════════════════════════════════════
// SPACING — iOS 4pt grid
// ══════════════════════════════════════════════════════════════════════════════

export const SPACE = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,    // iOS standard screen horizontal padding
  xxl: 24,
  xxxl: 32,
} as const;

// ══════════════════════════════════════════════════════════════════════════════
// BORDER RADIUS — iOS standard values
// ══════════════════════════════════════════════════════════════════════════════

export const RADIUS = {
  xs: 6,
  sm: 10,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

// ══════════════════════════════════════════════════════════════════════════════
// JAY-SPECIFIC ACCENT COLORS (consistent in both modes)
// ══════════════════════════════════════════════════════════════════════════════

export const JAY_ACCENT = {
  primary: '#007AFF',     // Uses systemBlue as primary action color
  routine: '#34C759',     // systemGreen for routine/health
  chat: '#5856D6',        // systemIndigo for JAY chat
  streak: '#FF9500',      // systemOrange for streaks
  scan: '#AF52DE',        // systemPurple for scan/analysis
  warning: '#FF3B30',     // systemRed for warnings
} as const;

// ══════════════════════════════════════════════════════════════════════════════
// THEME TYPE
// ══════════════════════════════════════════════════════════════════════════════

export type ThemeMode = 'light' | 'dark';

// Use a flexible type so light and dark can share the same interface
export type ThemeColors = {
  [K in keyof typeof iOS.light]: string;
};

export function getColors(mode: ThemeMode): ThemeColors {
  return iOS[mode] as ThemeColors;
}

const theme = { iOS, TYPE, SPACE, RADIUS, JAY_ACCENT, getColors };
export default theme;
