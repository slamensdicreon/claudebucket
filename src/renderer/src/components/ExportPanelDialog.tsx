import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { api } from '@renderer/lib/api'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Textarea } from '@renderer/components/ui/textarea'
import { Label } from '@renderer/components/ui/label'
import { useT } from '@renderer/i18n/useT'

export function ExportPanelDialog({ panelId }: { panelId: string }) {
  const [open, setOpen] = useState(false)
  const [descripcion, setDescripcion] = useState('')
  const [autor, setAutor] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const t = useT()

  async function handleExport() {
    setBusy(true)
    setStatus(null)
    try {
      const result = await api.marketplace.exportPanel({ panelId, descripcionPublica: descripcion, autorPublico: autor })
      setStatus(result.success ? t('export.savedAt', { path: result.filePath ?? '' }) : t('export.cancelled'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Share2 size={14} /> {t('panelDetail.exportPanel')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{t('exportPanel.title')}</DialogTitle>
        <div className="space-y-3">
          <div className="text-xs text-text-muted">{t('exportPanel.hint')}</div>
          <div>
            <Label htmlFor="export-desc">{t('exportPanel.descLabel')}</Label>
            <Textarea id="export-desc" className="mt-1.5" rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder={t('exportPanel.descPlaceholder')} />
          </div>
          <div>
            <Label htmlFor="export-autor">{t('exportPanel.authorLabel')}</Label>
            <Input id="export-autor" className="mt-1.5" value={autor} onChange={(e) => setAutor(e.target.value)} placeholder={t('exportPanel.authorPlaceholder')} />
          </div>
          <Button className="w-full" onClick={handleExport} disabled={busy}>
            {busy ? t('exportPanel.exporting') : t('exportPanel.export')}
          </Button>
          {status && <div className="text-xs text-text-dim">{status}</div>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
