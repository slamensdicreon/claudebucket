import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '@renderer/lib/api'
import type { ComparacionModo, ComparacionResult } from '@shared/types'
import { PageHeader } from '@renderer/components/PageHeader'
import { Card } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@renderer/components/ui/select'
import { SwarmCanvas, type SwarmNode } from '@renderer/components/SwarmCanvas'
import { cn } from '@renderer/lib/utils'
import { useT } from '@renderer/i18n/useT'

function toNodes(result: ComparacionResult['testA']): SwarmNode[] {
  return result.respuestas.map((r) => ({ id: r.personaId, nombre: r.persona.nombre, score: r.scoreSatisfaccion, quote: r.opinionTexto.slice(0, 90) }))
}

export function ComparisonPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const t = useT()
  const MODES: Array<{ id: ComparacionModo; title: string; desc: string }> = [
    { id: 'mismo_panel_dos_estimulos', title: t('comparison.modeStimuli'), desc: t('comparison.modeStimuliDesc') },
    { id: 'mismo_estimulo_dos_paneles', title: t('comparison.modePanels'), desc: t('comparison.modePanelsDesc') }
  ]
  const [tests, setTests] = useState<Array<{ id: string; nombre: string; panelNombre: string }>>([])
  const [modo, setModo] = useState<ComparacionModo>('mismo_panel_dos_estimulos')
  const [testAId, setTestAId] = useState<string>('')
  const [testBId, setTestBId] = useState<string>('')
  const [result, setResult] = useState<ComparacionResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!workspaceId) return
    api.comparison.listTests(workspaceId).then(setTests)
  }, [workspaceId])

  async function handleCompare() {
    if (!workspaceId || !testAId || !testBId) return
    setLoading(true)
    try {
      const r = await api.comparison.run({ workspaceId, modo, testAId, testBId })
      setResult(r)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <PageHeader eyebrow={t('comparison.eyebrow')} title={t('comparison.title')} />

      <div className="mb-5 flex flex-wrap gap-3">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setModo(m.id)}
            className={cn(
              'w-72 rounded-xl border p-4 text-left',
              modo === m.id ? 'border-[1.5px] border-primary bg-surface' : 'border-border bg-surface'
            )}
          >
            <div className="mb-1 text-sm font-semibold text-text">{m.title}</div>
            <div className="text-xs text-text-dim">{m.desc}</div>
          </button>
        ))}
      </div>

      <Card className="max-w-3xl p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-1.5 font-mono-label text-[10.5px] text-text-dim">{t('comparison.testA')}</div>
            <Select value={testAId} onValueChange={setTestAId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('comparison.selectTest')} />
              </SelectTrigger>
              <SelectContent>
                {tests.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.panelNombre} — {t.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="mb-1.5 font-mono-label text-[10.5px] text-text-dim">{t('comparison.testB')}</div>
            <Select value={testBId} onValueChange={setTestBId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('comparison.selectTest')} />
              </SelectTrigger>
              <SelectContent>
                {tests.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.panelNombre} — {t.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button className="mt-4" onClick={handleCompare} disabled={loading || !testAId || !testBId || testAId === testBId}>
          {loading ? t('comparison.comparing') : t('comparison.compare')}
        </Button>
      </Card>

      {result && (
        <>
          <div className="mt-6 grid max-w-4xl grid-cols-1 gap-3.5 sm:grid-cols-2">
            {[result.testA, result.testB].map((r, i) => (
              <Card key={i} className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-semibold text-text">{r.test.nombre}</div>
                  <div className="font-mono-label text-[11px] text-text-dim">{r.respuestas.length} {t('comparison.personas')}</div>
                </div>
                <div className="mb-3 flex h-2 overflow-hidden rounded-full">
                  <div style={{ width: `${(r.distribucion.positivo / (r.respuestas.length || 1)) * 100}%`, background: 'var(--color-success)' }} />
                  <div style={{ width: `${(r.distribucion.neutro / (r.respuestas.length || 1)) * 100}%`, background: 'var(--color-warning)' }} />
                  <div style={{ width: `${(r.distribucion.negativo / (r.respuestas.length || 1)) * 100}%`, background: 'var(--color-danger)' }} />
                </div>
                <div className="h-[170px] overflow-hidden rounded-md bg-bg">
                  <SwarmCanvas nodes={toNodes(r)} />
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-6 max-w-4xl">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-text-muted">
              {t('comparison.deltaByPersona')}
              <span className={cn('font-mono-label text-xs', result.scorePromedioDelta >= 0 ? 'text-success' : 'text-danger')}>
                ({t('comparison.average')} {result.scorePromedioDelta >= 0 ? '+' : ''}
                {result.scorePromedioDelta.toFixed(1)})
              </span>
            </div>
            <div className="flex flex-col overflow-hidden rounded-card border border-border">
              {result.deltas
                .slice()
                .sort((a, b) => (b.delta ?? -99) - (a.delta ?? -99))
                .map((d) => (
                  <div key={d.personaId} className="flex items-center gap-3 border-b border-border p-3 text-xs last:border-b-0">
                    <div className="w-40 flex-none truncate font-medium text-text">{d.personaNombre}</div>
                    <div className="flex-1 font-mono-label text-text-dim">
                      {d.scoreA ?? '—'} → {d.scoreB ?? '—'}
                    </div>
                    <div
                      className={cn(
                        'w-16 flex-none rounded-chip px-2 py-0.5 text-center font-mono-label font-semibold',
                        d.delta === null
                          ? 'text-text-dim'
                          : d.delta > 0
                            ? 'bg-success/15 text-success'
                            : d.delta < 0
                              ? 'bg-danger/15 text-danger'
                              : 'text-text-dim'
                      )}
                    >
                      {d.delta === null ? '—' : d.delta > 0 ? `+${d.delta}` : d.delta}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
