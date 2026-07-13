export type ThemeMode = 'dark' | 'light' | 'high-contrast' | 'custom'

export interface ThemeColors {
  bg: string
  surface: string
  surface2: string
  border: string
  text: string
  textMuted: string
  textDim: string
  primary: string
  success: string
  warning: string
  danger: string
  chart2: string
  chart3: string
  chart4: string
  chart5: string
  chart6: string
}

export const THEME_PRESETS: Record<Exclude<ThemeMode, 'custom'>, ThemeColors> = {
  dark: {
    bg: '#0b0c0e',
    surface: '#15171a',
    surface2: '#1c1f23',
    border: 'rgba(255,255,255,0.08)',
    text: '#f2f3f5',
    textMuted: '#9095a0',
    textDim: '#5a5f68',
    primary: '#5eead4',
    success: '#4ade80',
    warning: '#fbbf24',
    danger: '#f87171',
    chart2: '#7c9cff',
    chart3: '#f472b6',
    chart4: '#a3e635',
    chart5: '#94a3b8',
    chart6: '#f97066'
  },
  light: {
    bg: '#f5f3ee',
    surface: '#ffffff',
    surface2: '#ece9e3',
    border: 'rgba(21,23,26,0.10)',
    text: '#15171a',
    textMuted: '#5b5f68',
    textDim: '#8a8e96',
    primary: '#0e7c72',
    success: '#1a9e5c',
    warning: '#b8790a',
    danger: '#c8483a',
    chart2: '#4a5fd1',
    chart3: '#c14e8a',
    chart4: '#5f9e1a',
    chart5: '#6b6f77',
    chart6: '#8e4fce'
  },
  'high-contrast': {
    bg: '#000000',
    surface: '#0d0d0d',
    surface2: '#191919',
    border: 'rgba(255,255,255,0.18)',
    text: '#ffffff',
    textMuted: '#c9c9c9',
    textDim: '#8a8a8a',
    primary: '#00e5ff',
    success: '#00ff85',
    warning: '#ffd400',
    danger: '#ff4d4d',
    chart2: '#ff6bd6',
    chart3: '#ffd400',
    chart4: '#00ff85',
    chart5: '#c9c9c9',
    chart6: '#ff4d4d'
  }
}

export const THEME_LABELS: Record<ThemeMode, string> = {
  dark: 'Oscuro',
  light: 'Claro',
  'high-contrast': 'Alto contraste',
  custom: 'Personalizado'
}

/** Fields a user can override in "custom" mode — everything else falls back to the dark preset. */
export const CUSTOMIZABLE_FIELDS: Array<{ field: keyof ThemeColors; label: string }> = [
  { field: 'bg', label: 'Fondo' },
  { field: 'surface', label: 'Superficie' },
  { field: 'text', label: 'Texto' },
  { field: 'primary', label: 'Color principal' }
]

const CSS_VAR_MAP: Record<keyof ThemeColors, string> = {
  bg: '--color-bg',
  surface: '--color-surface',
  surface2: '--color-surface-2',
  border: '--color-border',
  text: '--color-text',
  textMuted: '--color-text-muted',
  textDim: '--color-text-dim',
  primary: '--color-primary',
  success: '--color-success',
  warning: '--color-warning',
  danger: '--color-danger',
  chart2: '--chart-2',
  chart3: '--chart-3',
  chart4: '--chart-4',
  chart5: '--chart-5',
  chart6: '--chart-6'
}

export function resolveThemeColors(mode: ThemeMode, customColors: Partial<ThemeColors>): ThemeColors {
  if (mode === 'custom') return { ...THEME_PRESETS.dark, ...customColors }
  return THEME_PRESETS[mode]
}

/** Maps a ThemeColors field to its CSS custom property name — used by the renderer's DOM-applying code. */
export const THEME_CSS_VAR_MAP = CSS_VAR_MAP
