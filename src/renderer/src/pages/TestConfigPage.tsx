import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { api } from '@renderer/lib/api'
import { useAppStore } from '@renderer/store/useAppStore'
import type { EstimuloAttachment, EstimuloTipo, EtapaFunnelDraft, ModoInteraccion, Persona } from '@shared/types'
import { PROVIDER_DEFAULT_MODELS, PROVIDER_LABELS } from '@shared/types'
import { estimateTestCost } from '@shared/costEstimate'
import { PageHeader } from '@renderer/components/PageHeader'
import { Card } from '@renderer/components/ui/card'
import { Input } from '@renderer/components/ui/input'
import { Textarea } from '@renderer/components/ui/textarea'
import { Label } from '@renderer/components/ui/label'
import { Button } from '@renderer/components/ui/button'
import { FunnelBuilder } from '@renderer/components/FunnelBuilder'
import { FunnelTemplatePicker } from '@renderer/components/FunnelTemplatePicker'
import { AttachmentPicker } from '@renderer/components/AttachmentPicker'
import { cn } from '@renderer/lib/utils'
import { useT } from '@renderer/i18n/useT'

type EstimuloMode = 'single' | 'sequence'

function inferTipo(hasText: boolean, hasAttachments: boolean): EstimuloTipo {
  if (hasAttachments && hasText) return 'multimodal'
  if (hasAttachments) return 'imagen'
  return 'texto'
}

export function TestConfigPage() {
  const { workspaceId, panelId } = useParams<{ workspaceId: string; panelId: string }>()
  const navigate = useNavigate()
  const provider = useAppStore((s) => s.currentProvider)
  const model = useAppStore((s) => s.currentModel)
  const language = useAppStore((s) => s.language)
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [nombre, setNombre] = useState('')
  const [estimulo, setEstimulo] = useState('')
  const [scorecardInput, setScorecardInput] = useState('claridad, confianza, intencion de compra')
  const [attachments, setAttachments] = useState<EstimuloAttachment[]>([])
  const [estimuloMode, setEstimuloMode] = useState<EstimuloMode>('single')
  const [modoInteraccion, setModoInteraccion] = useState<ModoInteraccion>('individual')
  const [etapas, setEtapas] = useState<EtapaFunnelDraft[]>([
    { orden: 0, tipoEstimulo: 'texto', estimuloContenido: '', estimuloMetadata: {}, titulo: 'Etapa 1' },
    { orden: 1, tipoEstimulo: 'texto', estimuloContenido: '', estimuloMetadata: {}, titulo: 'Etapa 2' }
  ])
  const [running, setRunning] = useState(false)
  const t = useT()

  useEffect(() => {
    if (!panelId) return
    api.personas.list(panelId).then((list) => {
      setPersonas(list)
      setSelected(new Set(list.map((p) => p.id)))
    })
  }, [panelId])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const isValid =
    estimuloMode === 'single'
      ? estimulo.trim().length > 0 || attachments.length > 0
      : etapas.length > 0 &&
        etapas.every((e) => e.estimuloContenido.trim().length > 0 || e.estimuloMetadata.imagenDataUri || (e.estimuloMetadata.attachments?.length ?? 0) > 0)

  const stimulusChars =
    estimuloMode === 'single' ? estimulo.length : etapas.reduce((sum, e) => sum + e.estimuloContenido.length, 0)
  const costEstimate = estimateTestCost({
    provider,
    model: model ?? PROVIDER_DEFAULT_MODELS[provider][0],
    personaCount: selected.size,
    stimulusChars,
    stageCount: estimuloMode === 'sequence' ? etapas.length : 1
  })
  const scorecardCriteria = scorecardInput
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8)

  async function handleRun() {
    if (!workspaceId || !panelId || !isValid || selected.size === 0) return
    setRunning(true)
    try {
      if (estimuloMode === 'single') {
        const result = await api.tests.runSimple({
          workspaceId,
          panelId,
          nombre: nombre.trim() || t('testConfig.defaultTestName'),
          estimuloTipo: inferTipo(estimulo.trim().length > 0, attachments.length > 0),
          estimuloContenido: estimulo,
          imagenDataUri: attachments.find((attachment) => attachment.type === 'image')?.dataUri,
          attachments,
          provider,
          model: model ?? undefined,
          responseLanguage: language,
          personaIds: Array.from(selected),
          scorecardCriteria
        })
        navigate(`/w/${workspaceId}/panels/${panelId}/tests/${result.test.id}`)
      } else {
        const result = await api.funnel.run({
          workspaceId,
          panelId,
          nombre: nombre.trim() || t('testConfig.defaultFunnelName'),
          modoInteraccion,
          etapas,
          provider,
          model: model ?? undefined,
          responseLanguage: language,
          personaIds: Array.from(selected),
          scorecardCriteria
        })
        navigate(`/w/${workspaceId}/panels/${panelId}/tests/${result.test.id}/funnel`)
      }
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="p-8">
      <PageHeader
        eyebrow={t('testConfig.eyebrow')}
        title={t('testConfig.title')}
        backTo={`/w/${workspaceId}/panels/${panelId}`}
        backLabel={t('nav.backToPanel')}
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <div className="flex gap-[3px] rounded-lg border border-border bg-surface p-[3px]">
          <button
            className={cn('rounded-md px-3.5 py-1.5 text-xs font-medium', estimuloMode === 'sequence' ? 'bg-surface-2 font-semibold text-text' : 'text-text-dim')}
            onClick={() => setEstimuloMode('sequence')}
          >
            {t('testConfig.sequence')}
          </button>
          <button
            className={cn('rounded-md px-3.5 py-1.5 text-xs font-medium', estimuloMode === 'single' ? 'bg-surface-2 font-semibold text-text' : 'text-text-dim')}
            onClick={() => setEstimuloMode('single')}
          >
            {t('testConfig.single')}
          </button>
        </div>
        {estimuloMode === 'sequence' && (
          <div className="flex gap-[3px] rounded-lg border border-border bg-surface p-[3px]">
            <button
              className={cn('rounded-md px-3.5 py-1.5 text-xs font-medium', modoInteraccion === 'individual' ? 'bg-surface-2 font-semibold text-text' : 'text-text-dim')}
              onClick={() => setModoInteraccion('individual')}
            >
              {t('testConfig.individualMode')}
            </button>
            <button
              className={cn('rounded-md px-3.5 py-1.5 text-xs font-medium', modoInteraccion === 'focus_group' ? 'bg-surface-2 font-semibold text-text' : 'text-text-dim')}
              onClick={() => setModoInteraccion('focus_group')}
              title={t('testConfig.focusGroupTooltip')}
            >
              {t('testConfig.focusGroup')}
            </button>
          </div>
        )}
      </div>

      {modoInteraccion === 'focus_group' && estimuloMode === 'sequence' && selected.size > 20 && (
        <div className="mb-4 max-w-2xl rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          {t('testConfig.focusGroupWarning')}
        </div>
      )}

      <Card className="max-w-2xl p-5">
        <div className="space-y-4">
          <div>
            <Label htmlFor="test-nombre">{t('testConfig.nameLabel')}</Label>
            <Input id="test-nombre" className="mt-1.5" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={t('testConfig.namePlaceholder')} />
          </div>

          {estimuloMode === 'single' ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="test-estimulo">{t('testConfig.stimulusLabel')}</Label>
                <Textarea
                  id="test-estimulo"
                  className="mt-1.5"
                  rows={5}
                  value={estimulo}
                  onChange={(e) => setEstimulo(e.target.value)}
                  placeholder={t('testConfig.stimulusPlaceholder')}
                />
              </div>
              <div>
                <Label>{t('testConfig.imageLabel')}</Label>
                <div className="mt-1.5">
                  <AttachmentPicker value={attachments} onChange={setAttachments} />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label>{t('testConfig.stagesLabel')}</Label>
                <FunnelTemplatePicker onPick={setEtapas} />
              </div>
              <FunnelBuilder etapas={etapas} onChange={setEtapas} />
            </div>
          )}
          <div>
            <Label htmlFor="scorecard">{t('testConfig.scorecardLabel')}</Label>
            <Input
              id="scorecard"
              className="mt-1.5"
              value={scorecardInput}
              onChange={(e) => setScorecardInput(e.target.value)}
              placeholder={t('testConfig.scorecardPlaceholder')}
            />
          </div>
        </div>
      </Card>

      <div className="mt-5 max-w-2xl">
        <Label>{t('testConfig.personasIncluded', { selected: selected.size, total: personas.length })}</Label>
        <div className="mt-1.5 max-h-60 space-y-1 overflow-y-auto rounded-lg border border-border bg-surface p-2">
          {personas.map((p) => (
            <label
              key={p.id}
              className={cn('flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm', selected.has(p.id) ? 'text-text' : 'text-text-dim')}
            >
              <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
              {p.nombre} <span className="text-xs text-text-dim">· {p.ocupacion}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-6 flex max-w-2xl items-center justify-between rounded-card border border-border bg-surface p-4">
        <div className="font-mono-label text-[11.5px] text-text-dim">
          ~{selected.size} {t('comparison.personas')} · {t('testConfig.provider')}: {PROVIDER_LABELS[provider]}
          {costEstimate.estimatedCostUsd !== null && (
            <> · ~${costEstimate.estimatedCostUsd < 0.01 ? '<0.01' : costEstimate.estimatedCostUsd.toFixed(2)} {t('testConfig.estimated')}</>
          )}
        </div>
        <Button onClick={handleRun} disabled={running || !isValid || selected.size === 0}>
          {running ? t('testConfig.running') : t('testConfig.run')} <ArrowRight size={14} />
        </Button>
      </div>
    </div>
  )
}
