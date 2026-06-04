// ============================================================
// DESIGN SYSTEM — FINCOACH
// Deux thèmes : dark (défaut) et light
// ============================================================

export const DARK_COLORS = {
  // ── Surfaces ────────────────────────────────────────────
  background:             '#070E1C',
  surface:                '#0B1526',
  surfaceLight:           '#101D30',
  surfaceLighter:         '#152238',
  surfaceContainerHigh:   '#1E2D42',
  surfaceContainerLowest: '#060C18',

  // ── Marque ──────────────────────────────────────────────
  primary:          '#3DE8A0',
  primaryDark:      '#00C47A',
  primaryContainer: '#003D27',

  secondary:          '#F5B731',
  secondaryContainer: '#6B4F00',

  // ── Verre / glassmorphisme ───────────────────────────────
  glassBg:     'rgba(16, 29, 48, 0.75)',
  glassBorder: 'rgba(255, 255, 255, 0.07)',

  // ── Texte ───────────────────────────────────────────────
  textPrimary:      '#E2E8F8',
  textSecondary:    '#8BA3BF',
  textWhite:        '#FFFFFF',
  onSurface:        '#E2E8F8',
  onSurfaceVariant: '#8BA3BF',

  // ── Tokens composites ────────────────────────────────────
  cardBg:      '#101D30',
  inputBg:     '#0D1928',
  border:      'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
  divider:     'rgba(255, 255, 255, 0.05)',
  placeholder: 'rgba(139, 163, 191, 0.45)',
  onPrimary:   '#002817',

  // ── Sémantique ───────────────────────────────────────────
  income:         '#00C47A',
  expense:        '#FF5C5C',
  warning:        '#F5B731',
  error:          '#FF5C5C',
  errorContainer: '#5C0000',

  transparent: 'transparent',
};

export const LIGHT_COLORS = {
  // ── Surfaces ────────────────────────────────────────────
  background:             '#EFF3FF',
  surface:                '#FFFFFF',
  surfaceLight:           '#FFFFFF',
  surfaceLighter:         '#F5F8FF',
  surfaceContainerHigh:   '#E2E9F8',
  surfaceContainerLowest: '#EAF0FA',

  // ── Marque ──────────────────────────────────────────────
  primary:          '#00875A',
  primaryDark:      '#006644',
  primaryContainer: '#C8F0DF',

  secondary:          '#A85E00',
  secondaryContainer: '#FFE5B2',

  // ── Verre / glassmorphisme ───────────────────────────────
  glassBg:     'rgba(255, 255, 255, 0.90)',
  glassBorder: 'rgba(10, 30, 80, 0.09)',

  // ── Texte ───────────────────────────────────────────────
  textPrimary:      '#0B1626',
  textSecondary:    '#3B5270',
  textWhite:        '#FFFFFF',
  onSurface:        '#0B1626',
  onSurfaceVariant: '#3B5270',

  // ── Tokens composites ────────────────────────────────────
  cardBg:      '#FFFFFF',
  inputBg:     '#EBF0FF',
  border:      'rgba(10, 30, 80, 0.11)',
  borderLight: 'rgba(10, 30, 80, 0.07)',
  divider:     'rgba(10, 30, 80, 0.08)',
  placeholder: 'rgba(59, 82, 112, 0.50)',
  onPrimary:   '#FFFFFF',

  // ── Sémantique ───────────────────────────────────────────
  income:         '#006644',
  expense:        '#C0392B',
  warning:        '#B85E00',
  error:          '#C0392B',
  errorContainer: '#FCE8E8',

  transparent: 'transparent',
};

// Alias rétro-compatible
export const COLORS = DARK_COLORS;

// ── Ombres par thème ──────────────────────────────────────
export const getShadow = (isDark) => isDark
  ? {
      sm:  { shadowColor: '#000', shadowOffset: { width: 0, height: 2  }, shadowOpacity: 0.30, shadowRadius: 6,  elevation: 4  },
      md:  { shadowColor: '#000', shadowOffset: { width: 0, height: 4  }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8  },
      lg:  { shadowColor: '#000', shadowOffset: { width: 0, height: 8  }, shadowOpacity: 0.40, shadowRadius: 20, elevation: 14 },
      glow: (color) => ({ shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8 }),
    }
  : {
      sm:  { shadowColor: '#0A1E50', shadowOffset: { width: 0, height: 1  }, shadowOpacity: 0.07, shadowRadius: 4,  elevation: 2 },
      md:  { shadowColor: '#0A1E50', shadowOffset: { width: 0, height: 3  }, shadowOpacity: 0.09, shadowRadius: 10, elevation: 4 },
      lg:  { shadowColor: '#0A1E50', shadowOffset: { width: 0, height: 6  }, shadowOpacity: 0.11, shadowRadius: 16, elevation: 6 },
      glow: (color) => ({ shadowColor: color, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 10, elevation: 4 }),
    };

// ── Espacement ────────────────────────────────────────────
export const SPACING = {
  base: 4, gutter: 12,
  stackSm: 8, stackMd: 16, stackLg: 24,
  marginX: 20,
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 8, md: 14, lg: 20, xl: 24, full: 9999,
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

export const TYPOGRAPHY = {
  fontFamily: 'System',
  sizes: {
    displayAmount: { fontSize: 36, lineHeight: 44, fontWeight: '700' },
    headlineLg:    { fontSize: 28, lineHeight: 34, fontWeight: '700' },
    headlineMd:    { fontSize: 22, lineHeight: 28, fontWeight: '600' },
    bodyLg:        { fontSize: 16, lineHeight: 24, fontWeight: '400' },
    bodyMd:        { fontSize: 14, lineHeight: 20, fontWeight: '400' },
    labelCaps:     { fontSize: 11, lineHeight: 16, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
    labelSm:       { fontSize: 11, lineHeight: 14, fontWeight: '500' },
  },
};

export const SCREEN_SIZES = { maxWidth: 440 };
