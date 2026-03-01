export type ThemeMode = 'dark' | 'light';

export const DarkTheme = {
  mode: 'dark' as ThemeMode,

  // Fondos
  bg:       '#000000',
  surface:  '#1c1c1e',
  surface2: '#2c2c2e',
  surface3: '#3a3a3c',

  // Bordes
  border:   '#38383a',
  borderDim:'#2c2c2e',

  // Acento principal — violeta/púrpura como referencia
  accent:      '#7c5cfc',
  accentLight: '#9b7dff',
  accentDim:   'rgba(124,92,252,0.15)',
  accentGlow:  'rgba(124,92,252,0.3)',

  // Naranja legacy (lo mantenemos para CTAs secundarios)
  orange:    '#f97316',
  orangeDim: 'rgba(249,115,22,0.12)',

  // Texto
  text:          '#ffffff',
  textSecondary: '#8e8e93',
  textMuted:     '#48484a',
  textInverse:   '#000000',

  // Semáforo
  green:  '#30d158',
  red:    '#ff453a',
  yellow: '#ffd60a',
  blue:   '#0a84ff',

  // UI específica
  overlay:     'rgba(0,0,0,0.75)',
  swipeDelete: '#ff453a',
  swipeEdit:   '#0a84ff',

  // Ring progress
  ringBg:      '#1c1c1e',
  ringStroke:  '#7c5cfc',
} as const;

export const LightTheme = {
  mode: 'light' as ThemeMode,

  bg:       '#f2f2f7',
  surface:  '#ffffff',
  surface2: '#f2f2f7',
  surface3: '#e5e5ea',

  border:    '#c6c6c8',
  borderDim: '#e5e5ea',

  accent:      '#5e35b1',
  accentLight: '#7c5cfc',
  accentDim:   'rgba(94,53,177,0.1)',
  accentGlow:  'rgba(94,53,177,0.2)',

  orange:    '#ea6c0a',
  orangeDim: 'rgba(234,108,10,0.1)',

  text:          '#000000',
  textSecondary: '#6c6c70',
  textMuted:     '#aeaeb2',
  textInverse:   '#ffffff',

  green:  '#34c759',
  red:    '#ff3b30',
  yellow: '#ffcc00',
  blue:   '#007aff',

  overlay:     'rgba(0,0,0,0.5)',
  swipeDelete: '#ff3b30',
  swipeEdit:   '#007aff',

  ringBg:     '#e5e5ea',
  ringStroke: '#5e35b1',
} as const;

export type AppTheme = typeof DarkTheme;
export const Colors = DarkTheme;

export const Spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
} as const;

export const Radius = {
  sm: 8, md: 12, lg: 16, xl: 22, xxl: 32, full: 999,
} as const;
