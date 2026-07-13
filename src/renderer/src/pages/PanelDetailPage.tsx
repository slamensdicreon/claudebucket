import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, FlaskConical, TrendingUp, Trash2 } from 'lucide-react'
import { api } from '@renderer/lib/api'
import type { CrowdmindTest, Panel, Persona } from '@shared/types'
import { PageHeader } from '@renderer/components/PageHeader'
import { Avatar } from '@renderer/components/Avatar'
import { Card, CardContent } from '@renderer/components/ui/card'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@renderer/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@renderer/components/ui/tabs'
import { PersonaForm } from '@renderer/components/PersonaForm'
import { GenerateWithAiDialog } from '@renderer/components/GenerateWithAiDialog'
import { CsvImportDialog } from '@renderer/components/CsvImportDialog'
import { InterviewDialog } from '@renderer/components/InterviewDialog'
import { ExportPanelDialog } from '@renderer/components/ExportPanelDialog'
import { NotesSection } from '@renderer/components/NotesSection'
import { formatDate } from '@renderer/lib/utils'
import { useT } from '@renderer/i18n/useT'

const DISPOSICION_VARIANT = {
  entusiasta: 'success',
  neutro: 'neutral',
  esceptico: 'warning',
  hostil: 'danger'
} as const

export function PanelDetailPage() {
  const { workspaceId, panelId } = useParams<{ workspaceId: string; panelId: string }>()
  const navigate = useNavigate()
  const [panel, setPanel] = useState<Panel | null>(null)
  const [personas, setPersonas] = useState<Persona[]>([])
  const [tests, setTests] = useState<CrowdmindTest[]>([])
  const [newPersonaOpen, setNewPersonaOpen] = useState(false)
  const [deletePanelOpen, setDeletePanelOpen] = useState(false)
  const [deletingPanel, setDeletingPanel] = useState(false)
  const t = useT()

  async function refreshAll() {
    if (!panelId) return
    const [p, ps, ts] = await Promise.all([api.panels.get(panelId), api.personas.list(panelId), api.tests.list(panelId)])
    setPanel(p)
    setPersonas(ps)
    setTests(ts)
  }

  useEffect(() => {
    refreshAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelId])

  if (!workspaceId || !panelId) return null

  async function handleDeletePanel() {
    if (!workspaceId || !panelId) return
    setDeletingPanel(true)
    try {
      await api.panels.delete(panelId)
      navigate(`/w/${workspaceId}/panels`)
    } finally {
      setDeletingPanel(false)
    }
  }

  return (
    <div className="p-8">
      <PageHeader
        eyebrow={t('panelDetail.eyebrow')}
        title={panel?.nombre ?? '…'}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => navigate(`/w/${workspaceId}/panels/${panelId}/timeline`)}>
              <TrendingUp size={14} /> {t('panelDetail.evolution')}
            </Button>
            <ExportPanelDialog panelId={panelId} />
            <Dialog open={deletePanelOpen} onOpenChange={setDeletePanelOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm">
                  <Trash2 size={14} /> {t('panelDetail.delete')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>{t('panelDetail.deleteTitle')}</DialogTitle>
                <div className="space-y-4">
                  <p className="text-sm text-text-muted">{t('panelDetail.deleteConfirm', { name: panel?.nombre ?? '' })}</p>
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setDeletePanelOpen(false)} disabled={deletingPanel}>
                      {t('personaDetail.cancel')}
                    </Button>
                    <Button onClick={handleDeletePanel} disabled={deletingPanel}>
                      {deletingPanel ? t('panelDetail.deleting') : t('panelDetail.delete')}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <Tabs defaultValue="personas">
        <TabsList>
          <TabsTrigger value="personas">{t('panelDetail.tabPersonas')} ({personas.length})</TabsTrigger>
          <TabsTrigger value="tests">{t('panelDetail.tabTests')} ({tests.length})</TabsTrigger>
          <TabsTrigger value="notes">{t('notes.tab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="personas">
          <div className="mb-4 flex justify-end gap-2">
            <GenerateWithAiDialog workspaceId={workspaceId} panelId={panelId} onSaved={refreshAll} />
            <InterviewDialog workspaceId={workspaceId} panelId={panelId} />
            <CsvImportDialog panelId={panelId} onSaved={refreshAll} />
            <Dialog open={newPersonaOpen} onOpenChange={setNewPersonaOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus size={14} /> {t('panelDetail.newPersona')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogTitle>{t('panelDetail.newPersonaTitle')}</DialogTitle>
                <PersonaForm
                  workspaceId={workspaceId}
                  enableAiImprove
                  onSubmit={async (draft) => {
                    await api.personas.create(panelId, draft)
                    setNewPersonaOpen(false)
                    refreshAll()
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          {personas.length === 0 ? (
            <Card>
              <CardContent className="py-14 text-center text-sm text-text-muted">
                {t('panelDetail.personasEmpty')}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {personas.map((p) => (
                <Card
                  key={p.id}
                  className="cursor-pointer p-4 transition-colors hover:border-primary/40"
                  onClick={() => navigate(`/w/${workspaceId}/panels/${panelId}/personas/${p.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar seed={p.avatarSeed} name={p.nombre} size={36} imageDataUri={p.avatarImageDataUri} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-text">{p.nombre}</div>
                      <div className="truncate text-xs text-text-dim">
                        {p.edad} {t('personaDetail.years')} · {p.ciudad}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="truncate text-xs text-text-muted">{p.ocupacion}</div>
                    <Badge variant={DISPOSICION_VARIANT[p.disposicionBase]}>{p.disposicionBase}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tests">
          <div className="mb-4 flex justify-end">
            <Button size="sm" onClick={() => navigate(`/w/${workspaceId}/panels/${panelId}/tests/new`)} disabled={personas.length === 0}>
              <Plus size={14} /> {t('panelDetail.newTest')}
            </Button>
          </div>
          {tests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
                <FlaskConical size={20} className="text-text-dim" />
                <div className="text-sm text-text-muted">
                  {personas.length === 0 ? t('panelDetail.testsEmptyNoPersonas') : t('panelDetail.testsEmpty')}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {tests.map((t) => (
                <Card
                  key={t.id}
                  className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:border-primary/40"
                  onClick={() =>
                    navigate(
                      `/w/${workspaceId}/panels/${panelId}/tests/${t.id}${t.tipo === 'funnel' ? '/funnel' : ''}`
                    )
                  }
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm font-semibold text-text">{t.nombre}</div>
                      {t.tipo === 'funnel' && <Badge variant="primary">funnel</Badge>}
                    </div>
                    <div className="truncate text-xs text-text-dim">{t.estimuloContenido}</div>
                  </div>
                  <div className="font-mono-label text-[11px] text-text-dim">{formatDate(t.createdAt)}</div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="notes">
          <NotesSection scopeType="panel" scopeId={panelId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
