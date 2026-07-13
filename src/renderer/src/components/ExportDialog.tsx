import { useState } from 'react'
import { FileJson, FileText, FileCode } from 'lucide-react'
import { api } from '@renderer/lib/api'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Card } from '@renderer/components/ui/card'
import { useT } from '@renderer/i18n/useT'

export function ExportDialog({ testId }: { testId: string }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState<'pdf-summary' | 'pdf-full' | 'json' | 'markdown' | null>(null)
  const t = useT()

  async function run(kind: 'pdf-summary' | 'pdf-full' | 'json' | 'markdown', action: () => Promise<{ success: boolean; filePath?: string }>) {
    setBusy(kind)
    setStatus(null)
    try {
      const result = await action()
      setStatus(result.success ? t('export.savedAt', { path: result.filePath ?? '' }) : t('export.cancelled'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <FileText size={14} /> {t('export.button')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{t('export.title')}</DialogTitle>
        <div className="flex flex-col gap-2.5">
          <Card className="p-4">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-text">
              <FileJson size={15} className="text-text-dim" /> {t('export.jsonTitle')}
            </div>
            <div className="mb-3 text-xs text-text-dim">{t('export.jsonDesc')}</div>
            <Button size="sm" variant="secondary" onClick={() => run('json', () => api.tests.exportJson(testId))} disabled={busy !== null}>
              {busy === 'json' ? t('export.exporting') : t('export.jsonDownload')}
            </Button>
          </Card>
          <Card className="p-4">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-text">
              <FileCode size={15} className="text-text-dim" /> {t('export.mdTitle')}
            </div>
            <div className="mb-3 text-xs text-text-dim">{t('export.mdDesc')}</div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => run('markdown', () => api.tests.exportMarkdown(testId))}
              disabled={busy !== null}
            >
              {busy === 'markdown' ? t('export.exporting') : t('export.mdDownload')}
            </Button>
          </Card>
          <Card className="p-4">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-text">
              <FileText size={15} className="text-text-dim" /> {t('export.pdfTitle')}
            </div>
            <div className="mb-3 text-xs text-text-dim">{t('export.pdfDesc')}</div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => run('pdf-summary', () => api.tests.exportPdf(testId, 'summary'))} disabled={busy !== null}>
                {busy === 'pdf-summary' ? t('export.generating') : t('export.pdfSummary')}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => run('pdf-full', () => api.tests.exportPdf(testId, 'full'))} disabled={busy !== null}>
                {busy === 'pdf-full' ? t('export.generating') : t('export.pdfFull')}
              </Button>
            </div>
          </Card>
          {status && <div className="text-xs text-text-dim">{status}</div>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
