import { useState } from 'react'
import { Upload, Pencil, Trash2 } from 'lucide-react'
import { api } from '@renderer/lib/api'
import type { CsvColumnMapping, CsvPreview, PersonaDraft } from '@shared/types'
import { CSV_MAPPABLE_FIELDS } from '@shared/types'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@renderer/components/ui/select'
import { PersonaForm } from './PersonaForm'
import { useT } from '@renderer/i18n/useT'

export function CsvImportDialog({ panelId, onSaved }: { panelId: string; onSaved: () => void }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<CsvPreview | null>(null)
  const [mapeo, setMapeo] = useState<CsvColumnMapping>({})
  const [agruparSimilares, setAgruparSimilares] = useState(true)
  const [drafts, setDrafts] = useState<PersonaDraft[] | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  function reset() {
    setPreview(null)
    setMapeo({})
    setDrafts(null)
  }

  async function handlePickFile() {
    const result = await api.personas.pickCsvFile()
    if (!result) return
    setPreview(result)
    setMapeo(Object.fromEntries(result.headers.map((h) => [h, ''])))
  }

  async function handlePreviewImport() {
    if (!preview) return
    setLoading(true)
    try {
      const result = await api.personas.importCsvPreview({ filePath: preview.filePath, mapeoColumnas: mapeo, agruparSimilares })
      setDrafts(result)
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm() {
    if (!drafts || drafts.length === 0) return
    setSaving(true)
    try {
      await api.personas.saveBulk(panelId, drafts)
      setOpen(false)
      reset()
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Upload size={14} /> {t('csv.button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogTitle>{t('csv.title')}</DialogTitle>

        {!preview ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="text-sm text-text-muted">{t('csv.pickPrompt')}</div>
            <Button onClick={handlePickFile}>{t('csv.pickFile')}</Button>
          </div>
        ) : !drafts ? (
          <div className="space-y-4">
            <div className="text-xs text-text-dim">{preview.filePath.split(/[\\/]/).pop()} · {preview.headers.length} {t('csv.columns')}</div>
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {preview.headers.map((header) => (
                <div key={header} className="flex items-center gap-3">
                  <div className="w-40 flex-none truncate text-xs text-text-muted">{header}</div>
                  <Select value={mapeo[header] || '__skip__'} onValueChange={(v) => setMapeo((m) => ({ ...m, [header]: v === '__skip__' ? '' : (v as CsvColumnMapping[string]) }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__skip__">{t('csv.noImport')}</SelectItem>
                      {CSV_MAPPABLE_FIELDS.map((f) => (
                        <SelectItem key={f.field} value={f.field}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <label className="flex items-center gap-2 text-xs text-text-muted">
              <input type="checkbox" checked={agruparSimilares} onChange={(e) => setAgruparSimilares(e.target.checked)} />
              {t('csv.groupSimilar')}
            </label>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={reset}>
                {t('csv.back')}
              </Button>
              <Button className="flex-1" onClick={handlePreviewImport} disabled={loading}>
                {loading ? t('csv.processing') : t('csv.preview')}
              </Button>
            </div>
          </div>
        ) : editingIndex !== null ? (
          <PersonaForm
            initial={drafts[editingIndex]}
            submitLabel={t('personaDetail.saveChanges')}
            onSubmit={(draft) => {
              setDrafts((prev) => prev!.map((p, i) => (i === editingIndex ? draft : p)))
              setEditingIndex(null)
            }}
          />
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-text-muted">{t('csv.readyCount', { count: drafts.length })}</div>
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {drafts.map((p, idx) => (
                <div key={idx} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-bg p-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-text">
                      {p.nombre} <span className="font-normal text-text-dim">· {p.edad} {t('personaDetail.years')}</span>
                    </div>
                    <div className="truncate text-xs text-text-muted">
                      {p.ocupacion} · {p.ciudad}, {p.pais} · {p.disposicionBase}
                    </div>
                  </div>
                  <div className="flex flex-none gap-1">
                    <button className="rounded p-1.5 text-text-dim hover:text-text" onClick={() => setEditingIndex(idx)}>
                      <Pencil size={13} />
                    </button>
                    <button className="rounded p-1.5 text-text-dim hover:text-danger" onClick={() => setDrafts((prev) => prev!.filter((_, i) => i !== idx))}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setDrafts(null)}>
                {t('csv.back')}
              </Button>
              <Button className="flex-1" onClick={handleConfirm} disabled={saving || drafts.length === 0}>
                {saving ? t('csv.saving') : t('csv.save', { count: drafts.length })}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
