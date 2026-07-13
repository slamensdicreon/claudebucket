import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FileText, MessageCircle, User } from 'lucide-react'
import { api } from '@renderer/lib/api'
import type { TestResultSummary } from '@shared/types'
import { PageHeader } from '@renderer/components/PageHeader'
import { Avatar } from '@renderer/components/Avatar'
import { Card, CardContent } from '@renderer/components/ui/card'
import { Badge } from '@renderer/components/ui/badge'
import { ConfidenceBadge } from '@renderer/components/ConfidenceBadge'
import { ThemesSection } from '@renderer/components/ThemesSection'
import { ExportDialog } from '@renderer/components/ExportDialog'
import { NotesSection } from '@renderer/components/NotesSection'
import { TestContinuationPanel } from '@renderer/components/TestContinuationPanel'
import { useT } from '@renderer/i18n/useT'

export function TestResultsPage() {
  const { workspaceId, panelId, testId } = useParams<{ workspaceId: string; panelId: string; testId: string }>()
  const navigate = useNavigate()
  const [summary, setSummary] = useState<TestResultSummary | null>(null)
  const t = useT()

  useEffect(() => {
    if (!testId) return
    api.tests.getResults(testId).then(setSummary)
  }, [testId])

  if (!summary) return <div className="p-8 text-sm text-text-dim">{t('testResults.loadingResults')}</div>

  const total = summary.respuestas.length || 1
  const distPct = {
    positivo: (summary.distribucion.positivo / total) * 100,
    neutro: (summary.distribucion.neutro / total) * 100,
    negativo: (summary.distribucion.negativo / total) * 100
  }

  return (
    <div className="p-8">
      <PageHeader
        eyebrow={t('testResults.eyebrow')}
        title={t('testResults.title', { name: summary.test.nombre })}
        backTo={`/w/${workspaceId}/panels/${panelId}`}
        backLabel={t('nav.backToPanel')}
        actions={
          <>
            <ConfidenceBadge indice={summary.test.indiceConfianza} disclaimers={summary.test.disclaimers} breakdown={summary.test.confianzaBreakdown} />
            {testId && <ExportDialog testId={testId} />}
          </>
        }
      />

      {(() => {
        const attachments =
          summary.test.estimuloMetadata.attachments ??
          (summary.test.estimuloMetadata.imagenDataUri
            ? [
                {
                  id: 'legacy-image',
                  type: 'image' as const,
                  name: t('testResults.imageAlt'),
                  mimeType: 'image/png',
                  dataUri: summary.test.estimuloMetadata.imagenDataUri,
                  sizeBytes: 0
                }
              ]
            : [])
        if (attachments.length === 0) return null
        return (
          <div className="mb-4 flex max-w-4xl flex-wrap gap-2">
            {attachments.map((attachment) =>
              attachment.type === 'image' ? (
                <img
                  key={attachment.id}
                  src={attachment.dataUri}
                  alt={attachment.name}
                  className="h-28 w-36 rounded-card border border-border object-cover"
                />
              ) : (
                <div key={attachment.id} className="flex h-28 w-36 flex-col items-center justify-center rounded-card border border-border bg-surface text-text-dim">
                  <FileText size={22} />
                  <div className="mt-2 max-w-[7rem] truncate text-xs">{attachment.name}</div>
                </div>
              )
            )}
          </div>
        )
      })()}

      <div className="grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="font-mono-label text-[10.5px] text-text-dim">{t('testResults.scorePromedio')}</div>
          <div className="mt-1 text-2xl font-semibold text-text">{summary.scorePromedio.toFixed(1)} / 10</div>
        </Card>
        <Card className="p-4">
          <div className="font-mono-label text-[10.5px] text-text-dim">{t('testResults.respuestas')}</div>
          <div className="mt-1 text-2xl font-semibold text-text">{summary.respuestas.length}</div>
        </Card>
        <Card className="p-4">
          <div className="font-mono-label text-[10.5px] text-text-dim">{t('testResults.distribucion')}</div>
          <div className="mt-2 flex h-2 overflow-hidden rounded-full">
            <div style={{ width: `${distPct.positivo}%`, background: 'var(--color-success)' }} />
            <div style={{ width: `${distPct.neutro}%`, background: 'var(--color-warning)' }} />
            <div style={{ width: `${distPct.negativo}%`, background: 'var(--color-danger)' }} />
          </div>
        </Card>
      </div>

      {(Object.keys(summary.scorecardPromedios).length > 0 || summary.benchmark.previousTests > 0) && (
        <div className="mt-4 grid max-w-4xl grid-cols-1 gap-3 lg:grid-cols-2">
          {Object.keys(summary.scorecardPromedios).length > 0 && (
            <Card className="p-4">
              <div className="font-mono-label text-[10.5px] text-text-dim">{t('testResults.scorecard')}</div>
              <div className="mt-3 space-y-2">
                {Object.entries(summary.scorecardPromedios).map(([criterio, score]) => (
                  <div key={criterio} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-text-muted">{criterio}</span>
                    <span className="font-mono-label text-xs font-semibold text-text">{score.toFixed(1)}/10</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {summary.benchmark.previousTests > 0 && (
            <Card className="p-4">
              <div className="font-mono-label text-[10.5px] text-text-dim">{t('testResults.benchmark')}</div>
              <div className="mt-2 text-sm text-text-muted">
                {t('testResults.benchmarkText', {
                  count: summary.benchmark.previousTests,
                  previous: summary.benchmark.previousAverage?.toFixed(1) ?? '-',
                  delta: summary.benchmark.delta === null ? '-' : `${summary.benchmark.delta >= 0 ? '+' : ''}${summary.benchmark.delta.toFixed(1)}`
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {summary.test.resumenEjecutivo && (
        <Card className="mt-4 max-w-4xl p-4">
          <div className="flex gap-3">
            <div className="h-fit flex-none rounded px-1.5 py-0.5 font-mono-label text-[9.5px] font-bold text-bg bg-warning">{t('testResults.aiBadge')}</div>
            <div className="text-sm leading-relaxed text-text-muted">{summary.test.resumenEjecutivo}</div>
          </div>
        </Card>
      )}

      {workspaceId && <TestContinuationPanel summary={summary} workspaceId={workspaceId} panelId={panelId} />}

      <div className="mt-6 max-w-4xl">
        <div className="mb-3 text-sm font-medium text-text-muted">{t('testResults.byPersona')}</div>
        <div className="space-y-2">
          {summary.respuestas.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar seed={r.persona.avatarSeed} name={r.persona.nombre} size={32} imageDataUri={r.persona.avatarImageDataUri} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-text">{r.persona.nombre}</div>
                    <div className="flex items-center gap-2">
                      <button
                        className="rounded p-1 text-text-dim hover:text-text"
                        title={t('testResults.viewProfile')}
                        onClick={() => navigate(`/w/${workspaceId}/panels/${panelId}/personas/${r.personaId}`)}
                      >
                        <User size={14} />
                      </button>
                      <button
                        className="rounded p-1 text-text-dim hover:text-primary"
                        title={t('testResults.chatWithPersona')}
                        onClick={() => navigate(`/w/${workspaceId}/panels/${panelId}/personas/${r.personaId}?tab=chat`)}
                      >
                        <MessageCircle size={14} />
                      </button>
                      <div className="font-mono-label text-xs font-semibold text-text">{r.scoreSatisfaccion}/10</div>
                    </div>
                  </div>
                  <div className="mt-1 text-sm text-text-muted">{r.opinionTexto}</div>
                  {Object.keys(r.scorecardScores).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {Object.entries(r.scorecardScores).map(([criterio, score]) => (
                        <Badge key={criterio} variant="neutral">
                          {criterio}: {score}/10
                        </Badge>
                      ))}
                    </div>
                  )}
                  {r.aspectosPositivos.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.aspectosPositivos.map((a, i) => (
                        <Badge key={i} variant="success">
                          {a}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {r.objeciones.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {r.objeciones.map((o, i) => (
                        <Badge key={i} variant="danger">
                          {o}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {summary.respuestas.length === 0 && (
        <Card className="mt-4 max-w-4xl">
          <CardContent className="text-sm text-text-dim">{t('testResults.empty')}</CardContent>
        </Card>
      )}

      {summary.respuestas.length > 0 && workspaceId && (
        <ThemesSection
          testId={summary.test.id}
          workspaceId={workspaceId}
          personasById={new Map(summary.respuestas.map((r) => [r.personaId, r.persona]))}
        />
      )}

      <div className="mt-8">
        <div className="mb-3 text-sm font-medium text-text-muted">{t('notes.testTitle')}</div>
        <NotesSection scopeType="test" scopeId={summary.test.id} />
      </div>
    </div>
  )
}
