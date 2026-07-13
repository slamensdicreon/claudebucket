import { useEffect, useState } from 'react'
import { ShieldCheck, ShieldAlert } from 'lucide-react'
import { api } from '@renderer/lib/api'
import { PROVIDER_DEFAULT_MODELS, PROVIDER_LABELS, type ProviderSetting } from '@shared/types'
import { PageHeader } from '@renderer/components/PageHeader'
import { Card } from '@renderer/components/ui/card'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Button } from '@renderer/components/ui/button'
import { Badge } from '@renderer/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@renderer/components/ui/select'
import { AppearanceSettings } from '@renderer/components/AppearanceSettings'
import { useAppStore } from '@renderer/store/useAppStore'
import { useT } from '@renderer/i18n/useT'
import { cn } from '@renderer/lib/utils'

function ProviderRow({ setting, onChanged }: { setting: ProviderSetting; onChanged: () => void }) {
  const [apiKey, setApiKey] = useState('')
  const [customModel, setCustomModel] = useState(setting.defaultModel)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null)
  const isLocal = setting.provider === 'local'
  const t = useT()
  const modelOptions = PROVIDER_DEFAULT_MODELS[setting.provider].includes(setting.defaultModel)
    ? PROVIDER_DEFAULT_MODELS[setting.provider]
    : [setting.defaultModel, ...PROVIDER_DEFAULT_MODELS[setting.provider]]

  useEffect(() => {
    setCustomModel(setting.defaultModel)
  }, [setting.defaultModel])

  async function handleSaveKey() {
    if (!apiKey.trim()) return
    setSaving(true)
    try {
      await api.settings.setApiKey({ provider: setting.provider, workspaceId: null, apiKey: apiKey.trim() })
      setApiKey('')
      onChanged()
    } finally {
      setSaving(false)
    }
  }

  async function handleClearKey() {
    await api.settings.clearApiKey({ provider: setting.provider, workspaceId: null })
    onChanged()
  }

  async function handleSaveModel() {
    const model = customModel.trim()
    if (!model) return
    await api.settings.setDefaultModel({ provider: setting.provider, workspaceId: null, model })
    onChanged()
  }

  async function handleTestProvider() {
    setTesting(true)
    setStatus(null)
    try {
      setStatus(await api.settings.testProvider({ provider: setting.provider, workspaceId: null }))
    } catch (err) {
      setStatus({ ok: false, message: err instanceof Error ? err.message : String(err) })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-text">{PROVIDER_LABELS[setting.provider]}</div>
          <div className="mt-1">
            {isLocal ? (
              <Badge variant="neutral">{t('settings.noApiKeyNeeded')}</Badge>
            ) : setting.hasApiKey ? (
              <Badge variant="success">{t('settings.apiKeyConfigured')}</Badge>
            ) : (
              <Badge variant="warning">{t('settings.noApiKey')}</Badge>
            )}
          </div>
        </div>
        <div className="w-52">
          <Label>{t('settings.defaultModel')}</Label>
          <Select
            value={setting.defaultModel}
            onValueChange={(model) =>
              api.settings.setDefaultModel({ provider: setting.provider, workspaceId: null, model }).then(onChanged)
            }
          >
            <SelectTrigger className="mt-1.5 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {modelOptions.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
        <Input value={customModel} onChange={(e) => setCustomModel(e.target.value)} placeholder={t('settings.customModelPlaceholder')} />
        <Button size="sm" variant="secondary" onClick={handleSaveModel} disabled={!customModel.trim()}>
          {t('settings.useModel')}
        </Button>
      </div>

      {!isLocal && (
        <div className="mt-3 flex gap-2">
          <Input
            type="password"
            placeholder={t('settings.apiKeyPlaceholder')}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
          />
          <Button size="sm" onClick={handleSaveKey} disabled={saving || !apiKey.trim()}>
            {t('settings.save')}
          </Button>
          {setting.hasApiKey && (
            <Button size="sm" variant="secondary" onClick={handleClearKey}>
              {t('settings.delete')}
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={handleTestProvider} disabled={testing || !setting.hasApiKey}>
            {testing ? t('settings.testing') : t('settings.test')}
          </Button>
        </div>
      )}
      {status && (
        <div className={cn('mt-2 text-xs', status.ok ? 'text-success' : 'text-danger')}>
          {status.message}
        </div>
      )}
      {setting.provider === 'openai' && (
        <div className="mt-2 text-xs text-text-muted">{t('settings.codexHint')}</div>
      )}
    </Card>
  )
}

function LanguageSettings() {
  const language = useAppStore((s) => s.language)
  const setLanguage = useAppStore((s) => s.setLanguage)
  const t = useT()

  return (
    <div>
      <div className="text-sm font-semibold text-text">{t('settings.language')}</div>
      <div className="mt-1 text-xs text-text-muted">{t('settings.languageHint')}</div>
      <div className="mt-3 flex gap-[3px] rounded-lg border border-border bg-surface p-[3px] w-fit">
        <button
          className={cn('rounded-md px-3.5 py-1.5 text-xs font-medium', language === 'es' ? 'bg-surface-2 font-semibold text-text' : 'text-text-dim')}
          onClick={() => setLanguage('es')}
        >
          Español
        </button>
        <button
          className={cn('rounded-md px-3.5 py-1.5 text-xs font-medium', language === 'en' ? 'bg-surface-2 font-semibold text-text' : 'text-text-dim')}
          onClick={() => setLanguage('en')}
        >
          English
        </button>
      </div>
    </div>
  )
}

export function SettingsPage() {
  const [settings, setSettings] = useState<ProviderSetting[]>([])
  const [encryptionAvailable, setEncryptionAvailable] = useState<boolean | null>(null)
  const t = useT()

  async function refresh() {
    const [list, enc] = await Promise.all([api.settings.listProviders(), api.settings.isEncryptionAvailable()])
    setSettings(list)
    setEncryptionAvailable(enc)
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <div className="p-8">
      <PageHeader eyebrow={t('settings.eyebrow')} title={t('settings.providersTitle')} />

      {encryptionAvailable !== null && (
        <div className="mb-5 flex max-w-2xl items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-muted">
          {encryptionAvailable ? (
            <>
              <ShieldCheck size={14} className="text-success" /> {t('settings.encryptionAvailable')}
            </>
          ) : (
            <>
              <ShieldAlert size={14} className="text-warning" /> {t('settings.encryptionUnavailable')}
            </>
          )}
        </div>
      )}

      <div className="max-w-2xl space-y-3">
        {settings.map((s) => (
          <ProviderRow key={s.provider} setting={s} onChanged={refresh} />
        ))}
      </div>

      <div className="mt-8 max-w-2xl">
        <LanguageSettings />
      </div>

      <div className="mt-8">
        <AppearanceSettings />
      </div>
    </div>
  )
}
