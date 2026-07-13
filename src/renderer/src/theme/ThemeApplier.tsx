import { useEffect } from 'react'
import { resolveThemeColors, THEME_CSS_VAR_MAP, type ThemeColors } from '@shared/theme'
import { useAppStore } from '@renderer/store/useAppStore'

function applyThemeToDocument(colors: ThemeColors, isLight: boolean): void {
  const root = document.documentElement
  for (const [field, cssVar] of Object.entries(THEME_CSS_VAR_MAP) as Array<[keyof ThemeColors, string]>) {
    root.style.setProperty(cssVar, colors[field])
  }
  root.dataset.theme = isLight ? 'light' : 'dark'
  root.style.colorScheme = isLight ? 'light' : 'dark'
}

/** Headless — applies the current theme's CSS variables to the document on mount and on every change. */
export function ThemeApplier() {
  const theme = useAppStore((s) => s.theme)
  const customColors = useAppStore((s) => s.customColors)

  useEffect(() => {
    applyThemeToDocument(resolveThemeColors(theme, customColors), theme === 'light')
  }, [theme, customColors])

  return null
}
