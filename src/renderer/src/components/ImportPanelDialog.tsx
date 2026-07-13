import { useEffect, useState } from 'react'
import { Download, FolderOpen, Users, Github, RefreshCw } from 'lucide-react'
import { api } from '@renderer/lib/api'
import type { MarketplacePanelTemplate } from '@shared/types'
import { PALETTE_COLORS } from '@renderer/lib/colors'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Card } from '@renderer/components/ui/card'
import { useT } from '@renderer/i18n/useT'

type TemplateEntry = { fileName: string; template: MarketplacePanelTemplate; fromRepo: boolean }

export function ImportPanelDialog({ workspaceId, onImported }: { workspaceId: string; onImported: () => void }) {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<TemplateEntry[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [template, setTemplate] = useState<MarketplacePanelTemplate | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = useT()

  useEffect(() => {
    if (open) api.marketplace.listBundled().then((list) => setEntries(list.map((b) => ({ ...b, fromRepo: false }))))
  }, [open])

  async function handleRefreshFromRepo() {
    setRefreshing(true)
    try {
      const remote = await api.marketplace.refreshFromRepo()
      setEntries((prev) => {
        const byFileName = new Map(prev.map((e) => [e.fileName, e]))
        for (const r of remote) byFileName.set(r.fileName, { ...r, fromRepo: true })
        return [...byFileName.values()].sort((a, b) => a.template.nombre.localeCompare(b.template.nombre))
      })
    } finally {
      setRefreshing(false)
    }
  }

  async function handlePickFile() {
    setLoading(true)
    setError(null)
    try {
      const result = await api.marketplace.importPanel()
      if (!result) return
      setTemplate(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm() {
    if (!template) return
    setSaving(true)
    try {
      const panel = await api.panels.create({
        workspaceId,
        nombre: template.nombre,
        descripcion: template.descripcionPublica,
        color: PALETTE_COLORS[Math.floor(Math.random() * PALETTE_COLORS.length)]
      })
      await api.personas.saveBulk(panel.id, template.personas)
      setOpen(false)
      setTemplate(null)
      onImported()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) setTemplate(null)
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Download size={14} /> {t('panels.marketplace')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogTitle>{t('importPanel.title')}</DialogTitle>

        {!template ? (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="text-xs text-text-muted">
                {t('importPanel.bundledHint')}{' '}
                <code className="rounded bg-surface-2 px-1 py-0.5 font-mono-label text-[11px]">resources/templates/</code>.
              </div>
              <button
                onClick={handleRefreshFromRepo}
                disabled={refreshing}
                title={t('importPanel.refreshTooltip')}
                className="flex flex-none items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-text-dim hover:text-text"
              >
                <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} /> {refreshing ? t('importPanel.refreshing') : t('importPanel.refresh')}
              </button>
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {entries.map((e) => (
                <button key={e.fileName} className="w-full text-left" onClick={() => setTemplate(e.template)}>
                  <Card className="p-3.5 hover:border-primary/40">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-text">{e.template.nombre}</div>
                      <div className="flex flex-none items-center gap-2">
                        {e.fromRepo && <Github size={11} className="text-text-dim" />}
                        <div className="flex items-center gap-1 font-mono-label text-[10.5px] text-text-dim">
                          <Users size={11} /> {e.template.personas.length}
                        </div>
                      </div>
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs text-text-muted">{e.template.descripcionPublica}</div>
                    {e.template.autorPublico && <div className="mt-1 text-[11px] text-text-dim">{t('importPanel.by', { author: e.template.autorPublico })}</div>}
                  </Card>
                </button>
              ))}
              {entries.length === 0 && <div className="py-6 text-center text-xs text-text-dim">{t('importPanel.empty')}</div>}
            </div>
            <div className="border-t border-border pt-3">
              <Button variant="secondary" size="sm" onClick={handlePickFile} disabled={loading}>
                <FolderOpen size={13} /> {loading ? t('importPanel.reading') : t('importPanel.importFromFile')}
              </Button>
              {error && <div className="mt-1.5 text-xs text-danger">{t('importPanel.invalidFile', { error })}</div>}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-bg p-3">
              <div className="text-sm font-semibold text-text">{template.nombre}</div>
              <div className="mt-1 text-xs text-text-muted">{template.descripcionPublica || t('panels.noDescription')}</div>
              {template.autorPublico && <div className="mt-1 text-xs text-text-dim">{t('importPanel.by', { author: template.autorPublico })}</div>}
              <div className="mt-2 font-mono-label text-[10.5px] text-text-dim">{template.personas.length} {t('importPanel.personas')}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setTemplate(null)}>
                {t('importPanel.back')}
              </Button>
              <Button className="flex-1" onClick={handleConfirm} disabled={saving}>
                {saving ? t('importPanel.creating') : t('importPanel.createPanel')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
