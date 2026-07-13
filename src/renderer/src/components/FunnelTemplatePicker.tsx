import { useEffect, useState } from 'react'
import { LayoutTemplate } from 'lucide-react'
import { api } from '@renderer/lib/api'
import type { EtapaFunnelDraft, FunnelTemplate } from '@shared/types'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Card } from '@renderer/components/ui/card'
import { useT } from '@renderer/i18n/useT'

export function FunnelTemplatePicker({ onPick }: { onPick: (etapas: EtapaFunnelDraft[]) => void }) {
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState<FunnelTemplate[]>([])
  const t = useT()

  useEffect(() => {
    if (open) api.funnel.listTemplates().then(setTemplates)
  }, [open])

  function handlePick(template: FunnelTemplate) {
    const etapas: EtapaFunnelDraft[] = template.etapas.map((e, i) => ({
      orden: i,
      tipoEstimulo: 'texto',
      estimuloContenido: e.estimuloContenido,
      estimuloMetadata: {},
      titulo: e.titulo
    }))
    onPick(etapas)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <LayoutTemplate size={13} /> {t('testConfig.useTemplate')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogTitle>{t('funnelTemplates.title')}</DialogTitle>
        <div className="mb-3 text-xs text-text-muted">{t('funnelTemplates.hint')}</div>
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {templates.map((tpl) => (
            <button key={tpl.nombre} className="w-full text-left" onClick={() => handlePick(tpl)}>
              <Card className="p-3.5 hover:border-primary/40">
                <div className="text-sm font-semibold text-text">{tpl.nombre}</div>
                <div className="mt-1 line-clamp-2 text-xs text-text-muted">{tpl.descripcion}</div>
                <div className="mt-2 font-mono-label text-[10.5px] text-text-dim">{t('funnelTemplates.stageCount', { count: tpl.etapas.length })}</div>
              </Card>
            </button>
          ))}
          {templates.length === 0 && <div className="py-6 text-center text-xs text-text-dim">{t('funnelTemplates.loading')}</div>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
