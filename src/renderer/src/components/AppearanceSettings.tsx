import { useAppStore } from '@renderer/store/useAppStore'
import { CUSTOMIZABLE_FIELDS, THEME_LABELS, resolveThemeColors, type ThemeMode } from '@shared/theme'
import { Card } from '@renderer/components/ui/card'
import { Label } from '@renderer/components/ui/label'
import { cn } from '@renderer/lib/utils'
import { useT } from '@renderer/i18n/useT'

const PRESET_MODES: ThemeMode[] = ['dark', 'light', 'high-contrast', 'custom']

export function AppearanceSettings() {
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  const customColors = useAppStore((s) => s.customColors)
  const setCustomColor = useAppStore((s) => s.setCustomColor)
  const t = useT()

  const previewColors = resolveThemeColors(theme, customColors)

  return (
    <Card className="max-w-2xl p-5">
      <div className="mb-1 text-sm font-semibold text-text">{t('settings.appearance')}</div>
      <div className="mb-4 text-xs text-text-dim">{t('settings.appearanceHint')}</div>

      <div className="flex flex-wrap gap-2">
        {PRESET_MODES.map((mode) => (
          <button
            key={mode}
            onClick={() => setTheme(mode)}
            className={cn(
              'rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors',
              theme === mode ? 'border-primary bg-primary/10 text-text' : 'border-border bg-surface-2 text-text-dim hover:text-text'
            )}
          >
            {THEME_LABELS[mode]}
          </button>
        ))}
      </div>

      {theme === 'custom' && (
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4">
          {CUSTOMIZABLE_FIELDS.map(({ field, label }) => (
            <div key={field}>
              <Label>{label}</Label>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  type="color"
                  value={previewColors[field]}
                  onChange={(e) => setCustomColor(field, e.target.value)}
                  className="h-8 w-8 flex-none cursor-pointer rounded border border-border bg-transparent p-0.5"
                />
                <span className="font-mono-label text-[10.5px] text-text-dim">{previewColors[field]}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-1.5 overflow-hidden rounded-lg border border-border">
        {(['bg', 'surface', 'primary', 'success', 'warning', 'danger'] as const).map((field) => (
          <div key={field} className="h-6 flex-1" style={{ background: previewColors[field] }} title={field} />
        ))}
      </div>
    </Card>
  )
}
