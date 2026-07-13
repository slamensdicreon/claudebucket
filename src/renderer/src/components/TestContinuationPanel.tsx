import { useEffect, useState } from 'react'
import { ChevronDown, MessageCircle, Sparkles, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '@renderer/lib/api'
import { useAppStore } from '@renderer/store/useAppStore'
import type { FollowUp, FollowUpResultSummary, TestResultSummary } from '@shared/types'
import { Card } from '@renderer/components/ui/card'
import { Textarea } from '@renderer/components/ui/textarea'
import { Button } from '@renderer/components/ui/button'
import { Avatar } from '@renderer/components/Avatar'
import { SwarmCanvas, type SwarmNode } from '@renderer/components/SwarmCanvas'
import { useT } from '@renderer/i18n/useT'

const QUICK_PROMPTS = [
  '¿Qué cambiarías para que esta propuesta te convenciera más?',
  '¿Cuál sería la principal razón para no comprar o no avanzar?',
  '¿Qué mensaje, precio o prueba social aumentaría tu confianza?'
]

export function TestContinuationPanel({
  summary,
  workspaceId,
  panelId
}: {
  summary: TestResultSummary
  workspaceId: string
  panelId?: string
}) {
  const t = useT()
  const navigate = useNavigate()
  const provider = useAppStore((s) => s.currentProvider)
  const model = useAppStore((s) => s.currentModel)
  const language = useAppStore((s) => s.language)
  const [open, setOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [pregunta, setPregunta] = useState('')
  const [sending, setSending] = useState(false)
  const [pastFollowUps, setPastFollowUps] = useState<FollowUp[]>([])
  const [activeResult, setActiveResult] = useState<FollowUpResultSummary | null>(null)

  async function refreshFollowUps() {
    const fus = await api.followUps.listForTest(summary.test.id)
    setPastFollowUps(fus)
    if (fus[0]) setActiveResult(await api.followUps.getResults(fus[0].id))
  }

  useEffect(() => {
    void refreshFollowUps()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary.test.id])

  const nodes: SwarmNode[] = summary.respuestas.map((r) => ({
    id: r.personaId,
    nombre: r.persona.nombre,
    score: r.scoreSatisfaccion,
    quote: r.opinionTexto.slice(0, 90)
  }))
  const allPersonaIds = summary.respuestas.map((r) => r.personaId)
  const targetIds = selectedIds.length > 0 ? selectedIds : allPersonaIds

  async function handleSend() {
    if (!pregunta.trim() || targetIds.length === 0) return
    setSending(true)
    try {
      const result = await api.followUps.run({
        testId: summary.test.id,
        workspaceId,
        personaIds: targetIds,
        pregunta,
        provider,
        model: model ?? undefined,
        responseLanguage: language
      })
      setActiveResult(result)
      setPastFollowUps((prev) => [result.followUp, ...prev])
      setPregunta('')
      setSelectedIds([])
    } finally {
      setSending(false)
    }
  }

  return (
    <Card className="mt-6 max-w-6xl p-4">
      <div className={open ? 'mb-3 flex flex-wrap items-center justify-between gap-2' : 'flex flex-wrap items-center justify-between gap-2'}>
        <div>
          <div className="text-sm font-semibold text-text">{t('continuation.title')}</div>
          <div className="mt-1 text-xs text-text-dim">
            {t('continuation.hint')}
            {pastFollowUps.length > 0 && <span className="ml-2 font-mono-label">{t('continuation.previousCount', { count: pastFollowUps.length })}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          {open && (
            <Button variant="secondary" size="sm" onClick={() => setSelectedIds(allPersonaIds)} disabled={allPersonaIds.length === 0}>
              <Users size={14} /> {t('continuation.selectAll')}
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => setOpen((v) => !v)}>
            <ChevronDown size={14} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
            {open ? t('continuation.collapse') : t('continuation.expand')}
          </Button>
        </div>
      </div>

      {open && (
        <>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <div className="mb-2 text-xs text-text-dim">{t('swarm.dragHint')}</div>
          <Card className="h-[360px] overflow-hidden">
            <SwarmCanvas
              nodes={nodes}
              selectable
              onSelectionChange={setSelectedIds}
              onNodeClick={(id) => panelId && navigate(`/w/${workspaceId}/panels/${panelId}/personas/${id}`)}
            />
          </Card>
        </div>

        <div className="rounded-card border border-border bg-surface-2 p-4">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-text">
            <MessageCircle size={14} /> {t('continuation.roundtable')}
          </div>
          <div className="mb-3 font-mono-label text-[10.5px] text-text-dim">
            {selectedIds.length > 0
              ? t('continuation.selectedTarget', { count: selectedIds.length })
              : t('continuation.allTarget', { count: allPersonaIds.length })}
          </div>
          <Textarea rows={4} value={pregunta} onChange={(e) => setPregunta(e.target.value)} placeholder={t('swarm.followUpPlaceholder')} />
          <div className="mt-2 flex flex-col gap-1.5">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setPregunta(prompt)}
                className="rounded-md border border-border px-2 py-1.5 text-left text-[11px] text-text-muted hover:border-primary/40 hover:text-text"
              >
                <Sparkles size={11} className="mr-1 inline" /> {prompt}
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setSelectedIds([])} disabled={selectedIds.length === 0}>
              {t('swarm.cancel')}
            </Button>
            <Button className="flex-1" onClick={handleSend} disabled={sending || !pregunta.trim() || targetIds.length === 0}>
              {sending ? t('swarm.sending') : t('continuation.askTarget', { count: targetIds.length })}
            </Button>
          </div>

          {pastFollowUps.length > 0 && (
            <div className="mt-5 border-t border-border pt-3">
              <div className="mb-2 font-mono-label text-[10.5px] font-semibold text-text-dim">{t('swarm.previousFollowUps')}</div>
              <div className="flex max-h-32 flex-col gap-1 overflow-y-auto">
                {pastFollowUps.map((fu) => (
                  <button
                    key={fu.id}
                    className="truncate rounded-md px-2 py-1.5 text-left text-xs text-text-muted hover:bg-surface"
                    onClick={() => api.followUps.getResults(fu.id).then(setActiveResult)}
                  >
                    "{fu.pregunta}"
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {activeResult && (
        <div className="mt-5">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-text">{t('swarm.followUpResults')}</div>
            <div className="rounded-md border border-border bg-surface px-2 py-0.5 font-mono-label text-[10.5px] text-text-dim">
              "{activeResult.followUp.pregunta}"
            </div>
          </div>
          <div className="flex flex-col overflow-hidden rounded-card border border-border">
            {activeResult.respuestas.map((r) => (
              <div key={r.id} className="flex items-start gap-3 border-b border-border p-3 last:border-b-0">
                <Avatar seed={r.persona.avatarSeed} name={r.persona.nombre} size={28} imageDataUri={r.persona.avatarImageDataUri} />
                <div className="w-36 flex-none">
                  <div className="truncate text-xs font-medium text-text">{r.persona.nombre}</div>
                  <button
                    className="mt-1 text-[11px] text-text-dim hover:text-primary"
                    onClick={() => panelId && navigate(`/w/${workspaceId}/panels/${panelId}/personas/${r.personaId}?tab=chat`)}
                  >
                    {t('testResults.chatWithPersona')}
                  </button>
                </div>
                <div className="flex-1 text-xs leading-relaxed text-text-muted">"{r.respuestaTexto}"</div>
              </div>
            ))}
          </div>
        </div>
      )}
        </>
      )}
    </Card>
  )
}
