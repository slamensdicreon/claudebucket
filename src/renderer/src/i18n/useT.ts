import { useCallback } from 'react'
import { useAppStore } from '@renderer/store/useAppStore'
import { es } from './es'
import { en } from './en'

export type TranslationKey = keyof typeof es

const DICTIONARIES: Record<'es' | 'en', Record<TranslationKey, string>> = { es, en }

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => (key in vars ? String(vars[key]) : match))
}

export function useT() {
  const language = useAppStore((s) => s.language)
  return useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      const dict = DICTIONARIES[language] ?? DICTIONARIES.es
      const template = dict[key] ?? es[key] ?? key
      return interpolate(template, vars)
    },
    [language]
  )
}
