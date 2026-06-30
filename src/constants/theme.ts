// ─────────────────────────────────────────────
//  SUSURROS — Design Token System  v2.0
//  8-px grid · Spectral Inferno palette
// ─────────────────────────────────────────────

// ── FOUNDATION ──────────────────────────────
export const PALETTE = {
  // Obsidian depths
  obsidian:   '#07070E',
  void:       '#0A0A0F',
  abyss:      '#0F0F1A',
  deep:       '#13131F',
  surface:    '#1A1A28',
  elevated:   '#222235',
  overlay:    '#2A2A40',

  // Gold — Ancient Ritual
  gold900:    '#7A5A18',
  gold700:    '#B8861E',
  gold500:    '#C9A84C',
  gold300:    '#E8CC80',
  gold100:    '#FFF0C0',
  goldGlow:   '#FFD060',

  // Blue — Spectral
  blue900:    '#0A1828',
  blue700:    '#183860',
  blue500:    '#2A6AAD',
  blue400:    '#4A90D9',
  blue300:    '#72AEE8',
  blue100:    '#C0DCFF',
  blueGlow:   '#8AC8FF',

  // Red — Infernal
  red900:     '#120505',
  red700:     '#3D0C0C',
  red500:     '#8B2020',
  red400:     '#C94040',
  red300:     '#E87070',
  red100:     '#FFD0D0',
  redGlow:    '#FF8080',

  // Cursed — Void Corruption
  cursed900:  '#080204',
  cursed700:  '#1A0508',
  cursed500:  '#3D0010',
  cursedRed:  '#7B0018',
  cursedGlow: '#C00028',

  // Neutrals
  stone600:   '#2A2A38',
  stone500:   '#383848',
  stone400:   '#4A4A5E',
  stone300:   '#6A6880',
  stone200:   '#8A8898',
  stone100:   '#C0BECC',

  // Semantic
  success:    '#2D7A50',
  successGlow:'#50C878',
  warning:    '#9A6A10',
  warningGlow:'#E8A020',
  error:      '#7A2020',
  errorGlow:  '#CF4040',
} as const;

// ── SEMANTIC COLOR TOKENS ────────────────────
export const COLORS = {
  // Backgrounds
  void:       PALETTE.void,
  abyss:      PALETTE.abyss,
  surface:    PALETTE.surface,
  elevated:   PALETTE.elevated,

  // Brand
  gold:       PALETTE.gold500,
  goldDim:    PALETTE.gold700,
  goldGlow:   PALETTE.goldGlow,
  goldSubtle: PALETTE.gold900,

  blue:       PALETTE.blue400,
  blueDeep:   PALETTE.blue900,
  blueMid:    PALETTE.blue700,
  blueGlow:   PALETTE.blueGlow,

  red:        PALETTE.red400,
  redDeep:    PALETTE.red900,
  redMid:     PALETTE.red700,
  redGlow:    PALETTE.redGlow,

  cursed:     PALETTE.cursed700,
  cursedRed:  PALETTE.cursedRed,
  cursedGlow: PALETTE.cursedGlow,

  // Strokes / Borders
  strokeSubtle:  PALETTE.stone600,
  strokeMid:     PALETTE.stone500,
  strokeActive:  PALETTE.gold500,

  // Text
  textPrimary:   '#EAE2D8',
  textSecondary: '#8A8898',
  textMuted:     '#4A4860',
  textDisabled:  '#333345',

  // Ash
  ash:    PALETTE.stone500,
  ashDim: PALETTE.stone600,

  // Feedback
  success:       PALETTE.successGlow,
  warning:       PALETTE.warningGlow,
  error:         PALETTE.errorGlow,
} as const;

// ── TYPOGRAPHY ───────────────────────────────
export const TYPOGRAPHY = {
  // Display — Cinzel Bold — títulos épicos
  hero: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 48,
    letterSpacing: 8,
    lineHeight: 58,
  },
  display: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 32,
    letterSpacing: 5,
    lineHeight: 40,
  },
  headline: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 22,
    letterSpacing: 3,
    lineHeight: 28,
  },
  title: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 17,
    letterSpacing: 2,
    lineHeight: 24,
  },

  // Label — Inter Bold — tags, botones, chips
  labelLg: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    letterSpacing: 2.5,
    lineHeight: 18,
  },
  label: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    letterSpacing: 2,
    lineHeight: 16,
  },
  labelSm: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    letterSpacing: 1.5,
    lineHeight: 14,
  },

  // Body — Inter Regular — descripción, flujo
  bodyLg: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    letterSpacing: 0.3,
    lineHeight: 24,
  },
  body: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    letterSpacing: 0.3,
    lineHeight: 20,
  },
  bodyBold: {
    fontFamily: 'Inter-Bold',
    fontSize: 13,
    letterSpacing: 0.5,
    lineHeight: 20,
  },
  caption: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    letterSpacing: 0.8,
    lineHeight: 16,
  },
  mono: {
    fontFamily: 'Inter-Bold',
    fontSize: 13,
    letterSpacing: 1,
    lineHeight: 18,
  },

  // Legacy aliases (backward compat)
  displayRegular: {
    fontFamily: 'Cinzel-Regular',
    letterSpacing: 2,
  },
} as const;

// ── 8-PX SPACING GRID ───────────────────────
export const SPACING = {
  0:    0,
  1:    4,
  xs:   4,
  2:    8,
  sm:   8,
  3:    12,
  md:   12,
  4:    16,
  base: 16,
  5:    20,
  6:    24,
  lg:   24,
  8:    32,
  xl:   32,
  10:   40,
  12:   48,
  '2xl':48,
  16:   64,
  '3xl':64,
  20:   80,
} as const;

// ── BORDER RADIUS ───────────────────────────
export const BORDER_RADIUS = {
  xs:   2,
  sm:   4,
  md:   8,
  lg:   12,
  xl:   16,
  '2xl':24,
  full: 9999,
} as const;

// ── GLOW SHADOWS ───────────────────────────
export const SHADOWS = {
  goldSubtle: {
    shadowColor: PALETTE.gold500,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  goldGlow: {
    shadowColor: PALETTE.goldGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 10,
  },
  blueGlow: {
    shadowColor: PALETTE.blue400,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
  redGlow: {
    shadowColor: PALETTE.red400,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
  cursedGlow: {
    shadowColor: PALETTE.cursedGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 12,
  },
  panel: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 16,
  },
} as const;

// ── GRADIENT DEFINITIONS (para LinearGradient) ─
export const GRADIENTS = {
  // Botón primario
  primaryBtn:    ['#2A1E06', '#1A1204'] as const,
  primaryBtnPrs: ['#1A1204', '#0E0B02'] as const,

  // Botón danger
  dangerBtn:     ['#2A0808', '#180404'] as const,

  // Paneles
  panel:         ['#171724', '#0F0F1A'] as const,
  panelDeep:     ['#0F0F1A', '#07070E'] as const,

  // Tarjetas tablero — oculto
  cardHidden:    ['#131320', '#0D0D18'] as const,

  // Tarjetas reveladas
  cardBlue:      ['#0F2040', '#080F1E'] as const,
  cardRed:       ['#2A0A0A', '#150404'] as const,
  cardNeutral:   ['#18182A', '#0F0F1A'] as const,
  cardCursed:    ['#180808', '#0A0404'] as const,

  // Background screens
  screenOverlay: ['rgba(7,7,14,0)', 'rgba(7,7,14,0.85)'] as const,
} as const;
