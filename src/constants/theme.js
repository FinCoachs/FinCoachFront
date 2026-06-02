// ============================================
// DESIGN SYSTEM - FINCOACH
// ============================================

export const COLORS = {
  // Background & Surface
  background: '#080F1E',
  surface: '#0c1322',
  surfaceLight: '#0F1E35',
  surfaceLighter: '#162540',
  surfaceContainerLowest: '#070e1d',
  surfaceContainerHigh: '#232a3a',

  // Primary Accent (Emerald Green)
  primary: '#44f3a9',
  primaryDark: '#00d68f',
  primaryContainer: '#00d68f',
  primaryFixed: '#54feb3',
  primaryFixedDim: '#27e199',

  // Secondary Accent (Gold)
  secondary: '#f8bd45',
  secondaryContainer: '#bc8709',
  secondaryFixed: '#ffdea7',

  // Glassmorphism
  glassBg: 'rgba(15, 30, 53, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.07)',

  // Text
  textPrimary: '#dce2f8',
  textSecondary: '#bacbbe',
  textWhite: '#ffffff',
  onSurface: '#dce2f8',
  onSurfaceVariant: '#bacbbe',

  // Utility
  transparent: 'transparent',
  error: '#ffb4ab',
  errorContainer: '#93000a',
};

export const TYPOGRAPHY = {
  fontFamily: 'System',
  sizes: {
    displayAmount: { fontSize: 36, lineHeight: 44, fontWeight: '700' },
    headlineLg: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
    headlineMd: { fontSize: 22, lineHeight: 28, fontWeight: '600' },
    bodyLg: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
    bodyMd: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
    labelCaps: { fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 0.6 },
    labelSm: { fontSize: 11, lineHeight: 14, fontWeight: '500' },
  }
};

export const SPACING = {
  base: 4,
  gutter: 12,
  stackSm: 8,
  stackMd: 16,
  stackLg: 24,
  marginX: 20,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 24,
  full: 9999,
};

export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const SCREEN_SIZES = {
  maxWidth: 440,
};