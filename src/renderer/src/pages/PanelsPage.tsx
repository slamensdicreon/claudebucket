import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Users } from 'lucide-react'
import { api } from '@renderer/lib/api'
import type { Panel } from '@shared/types'
import { PageHeader } from '@renderer/components/PageHeader'
import { Card, CardContent } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Textarea } from '@renderer/components/ui/textarea'
import { Label } from '@renderer/components/ui/label'
import { cn } from '@renderer/lib/utils'
import { PALETTE_COLORS } from '@renderer/lib/colors'
import { ImportPanelDialog } from '@renderer/components/ImportPanelDialog'
import { useT } from '@renderer/i18n/useT'

export function PanelsPage() {
  const t = useT()
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const navigate = useNavigate()
  const [panels, setPanels] = useState<Panel[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [color, setColor] = useState(PALETTE_COLORS[0])

  async function refresh() {
    if (!workspaceId) return
    setLoading(true)
    const list = await api.panels.list(workspaceId)
    setPanels(list)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  async function handleCreate() {
    if (!workspaceId || !nombre.trim()) return
    const panel = await api.panels.create({ workspaceId, nombre, descripcion, color })
    setNombre('')
    setDescripcion('')
    setOpen(false)
    setPanels((prev) => [panel, ...prev])
    navigate(`/w/${workspaceId}/panels/${panel.id}`)
  }

  return (
    <div className="p-8">
      <PageHeader
        eyebrow={t('panels.eyebrow')}
        title={t('panels.title')}
        actions={
          <>
            {workspaceId && <ImportPanelDialog workspaceId={workspaceId} onImported={refresh} />}
            <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus size={14} /> {t('panels.new')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>{t('panels.newTitle')}</DialogTitle>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="panel-nombre">{t('panels.nameLabel')}</Label>
                  <Input id="panel-nombre" className="mt-1.5" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={t('panels.namePlaceholder')} />
                </div>
                <div>
                  <Label htmlFor="panel-desc">{t('panels.descLabel')}</Label>
                  <Textarea id="panel-desc" className="mt-1.5" rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder={t('panels.descPlaceholder')} />
                </div>
                <div>
                  <Label>{t('panels.colorLabel')}</Label>
                  <div className="mt-1.5 flex gap-2">
                    {PALETTE_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={cn('h-6 w-6 rounded-full border-2', color === c ? 'border-text' : 'border-transparent')}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
                <Button className="w-full" onClick={handleCreate}>
                  {t('panels.create')}
                </Button>
              </div>
            </DialogContent>
            </Dialog>
          </>
        }
      />

      {loading ? (
        <div className="text-sm text-text-dim">{t('panels.loading')}</div>
      ) : panels.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <Users size={22} className="text-text-dim" />
            <div className="text-sm text-text-muted">{t('panels.empty')}</div>
            <Button size="sm" className="mt-2" onClick={() => setOpen(true)}>
              {t('panels.createFirst')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {panels.map((p) => (
            <Card
              key={p.id}
              className="cursor-pointer p-4 transition-colors hover:border-primary/40"
              onClick={() => navigate(`/w/${workspaceId}/panels/${p.id}`)}
            >
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 flex-none rounded-full" style={{ background: p.color }} />
                <div className="truncate text-sm font-semibold text-text">{p.nombre}</div>
                {p.esPublico && (
                  <span className="rounded-chip border border-primary/30 bg-primary/15 px-1.5 py-0.5 font-mono-label text-[9.5px] text-primary">
                    {t('panels.public')}
                  </span>
                )}
              </div>
              <div className="mt-2 line-clamp-2 text-xs text-text-muted">{p.descripcion || t('panels.noDescription')}</div>
              <div className="mt-3 font-mono-label text-[10.5px] text-text-dim">{p.personaCount ?? 0} {t('panels.personaCount')}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
