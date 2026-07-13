import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '@renderer/lib/api'
import type { Panel, PanelTimelinePoint } from '@shared/types'
import { PageHeader } from '@renderer/components/PageHeader'
import { Card } from '@renderer/components/ui/card'
import { formatDate } from '@renderer/lib/utils'
import { useT } from '@renderer/i18n/useT'

const CHART_WIDTH = 900
const CHART_HEIGHT = 220
const PADDING = 20

export function PanelTimelinePage() {
  const { workspaceId, panelId } = useParams<{ workspaceId: string; panelId: string }>()
  const navigate = useNavigate()
  const [panel, setPanel] = useState<Panel | null>(null)
  const [points, setPoints] = useState<PanelTimelinePoint[]>([])
  const t = useT()

  useEffect(() => {
    if (!panelId) return
    Promise.all([api.panels.get(panelId), api.timeline.getForPanel(panelId)]).then(([p, pts]) => {
      setPanel(p)
      setPoints(pts)
    })
  }, [panelId])

  if (!panel) return <div className="p-8 text-sm text-text-dim">{t('common.loading')}</div>

  if (points.length === 0) {
    return (
      <div className="p-8">
        <PageHeader eyebrow={`${t('timeline.eyebrowPrefix')}: ${panel.nombre.toUpperCase()}`} title={t('timeline.title')} />
        <Card className="p-6 text-center text-sm text-text-dim">{t('timeline.empty')}</Card>
      </div>
    )
  }

  const maxScore = 10
  const xFor = (i: number) => PADDING + (i / Math.max(1, points.length - 1)) * (CHART_WIDTH - PADDING * 2)
  const yFor = (score: number) => CHART_HEIGHT - PADDING - (score / maxScore) * (CHART_HEIGHT - PADDING * 2)
  const linePoints = points.map((p, i) => `${xFor(i)},${yFor(p.scorePromedio)}`).join(' ')
  const gridLines = [0, 2.5, 5, 7.5, 10].map((s) => yFor(s))

  return (
    <div className="p-8">
      <PageHeader eyebrow={`${t('timeline.eyebrowPrefix')}: ${panel.nombre.toUpperCase()}`} title={t('timeline.title')} />

      <Card className="max-w-5xl p-6">
        <svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
          {gridLines.map((y, i) => (
            <line key={i} x1={0} x2={CHART_WIDTH} y1={y} y2={y} stroke="var(--color-border)" strokeWidth={1} />
          ))}
          <polyline points={linePoints} fill="none" stroke="var(--color-primary)" strokeWidth={2.5} />
          {points.map((p, i) => (
            <circle key={p.testId} cx={xFor(i)} cy={yFor(p.scorePromedio)} r={4} fill="var(--color-primary)" />
          ))}
        </svg>
        <div className="mt-2 flex justify-between font-mono-label text-[10.5px] text-text-dim">
          {points.map((p) => (
            <span key={p.testId}>{formatDate(p.createdAt)}</span>
          ))}
        </div>
      </Card>

      <Card className="mt-4 max-w-5xl overflow-hidden">
        <div className="grid grid-cols-[100px_1fr_80px_110px] gap-2.5 border-b border-border px-4 py-2.5 font-mono-label text-[10.5px] text-text-dim">
          <div>{t('timeline.date')}</div>
          <div>{t('timeline.stimulus')}</div>
          <div>{t('timeline.score')}</div>
          <div />
        </div>
        {points
          .slice()
          .reverse()
          .map((p) => (
            <div key={p.testId} className="grid grid-cols-[100px_1fr_80px_110px] items-center gap-2.5 border-b border-border px-4 py-3 text-[12.5px] last:border-b-0">
              <div className="font-mono-label text-[11.5px] text-text-dim">{formatDate(p.createdAt)}</div>
              <div className="truncate text-text">{p.nombre}</div>
              <div className="font-mono-label font-semibold text-text">{p.scorePromedio.toFixed(1)}</div>
              <button
                className="text-left text-xs font-medium text-primary"
                onClick={() =>
                  navigate(`/w/${workspaceId}/panels/${panelId}/tests/${p.testId}${p.tipo === 'funnel' ? '/funnel' : ''}`)
                }
              >
                {t('timeline.viewResults')}
              </button>
            </div>
          ))}
      </Card>
    </div>
  )
}
