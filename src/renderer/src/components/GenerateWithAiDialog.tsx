import { useEffect, useMemo, useState } from 'react'
import { Sparkles, Pencil, Trash2 } from 'lucide-react'
import { api } from '@renderer/lib/api'
import { useAppStore } from '@renderer/store/useAppStore'
import type { PersonaDraft } from '@shared/types'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Textarea } from '@renderer/components/ui/textarea'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { PersonaForm } from './PersonaForm'
import { useT } from '@renderer/i18n/useT'

interface GenerationFormState {
  audience: string
  market: string
  productContext: string
  researchGoal: string
  mustInclude: string
  mustAvoid: string
  diversityAxes: string
  tone: string
  notes: string
  count: number
}

const DEFAULT_GENERATION_FORM: GenerationFormState = {
  audience: '',
  market: '',
  productContext: '',
  researchGoal: '',
  mustInclude: '',
  mustAvoid: '',
  diversityAxes: '',
  tone: 'profesional, especifico y accionable',
  notes: '',
  count: 5
}

export function GenerateWithAiDialog({
  workspaceId,
  panelId,
  onSaved
}: {
  workspaceId: string
  panelId: string
  onSaved: () => void
}) {
  const provider = useAppStore((s) => s.currentProvider)
  const model = useAppStore((s) => s.currentModel)
  const storageKey = useMemo(() => `crowdmind.personaGenerationForm.${workspaceId}.${panelId}`, [workspaceId, panelId])
  const [open, setOpen] = useState(false)
  const [audience, setAudience] = useState(DEFAULT_GENERATION_FORM.audience)
  const [market, setMarket] = useState(DEFAULT_GENERATION_FORM.market)
  const [productContext, setProductContext] = useState(DEFAULT_GENERATION_FORM.productContext)
  const [researchGoal, setResearchGoal] = useState(DEFAULT_GENERATION_FORM.researchGoal)
  const [mustInclude, setMustInclude] = useState(DEFAULT_GENERATION_FORM.mustInclude)
  const [mustAvoid, setMustAvoid] = useState(DEFAULT_GENERATION_FORM.mustAvoid)
  const [diversityAxes, setDiversityAxes] = useState(DEFAULT_GENERATION_FORM.diversityAxes)
  const [tone, setTone] = useState(DEFAULT_GENERATION_FORM.tone)
  const [notes, setNotes] = useState(DEFAULT_GENERATION_FORM.notes)
  const [count, setCount] = useState(DEFAULT_GENERATION_FORM.count)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<PersonaDraft[] | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const t = useT()
  const canGenerate = audience.trim().length > 0 || productContext.trim().length > 0 || researchGoal.trim().length > 0

  function currentFormState(): GenerationFormState {
    return { audience, market, productContext, researchGoal, mustInclude, mustAvoid, diversityAxes, tone, notes, count }
  }

  function applyFormState(state: Partial<GenerationFormState>) {
    setAudience(state.audience ?? DEFAULT_GENERATION_FORM.audience)
    setMarket(state.market ?? DEFAULT_GENERATION_FORM.market)
    setProductContext(state.productContext ?? DEFAULT_GENERATION_FORM.productContext)
    setResearchGoal(state.researchGoal ?? DEFAULT_GENERATION_FORM.researchGoal)
    setMustInclude(state.mustInclude ?? DEFAULT_GENERATION_FORM.mustInclude)
    setMustAvoid(state.mustAvoid ?? DEFAULT_GENERATION_FORM.mustAvoid)
    setDiversityAxes(state.diversityAxes ?? DEFAULT_GENERATION_FORM.diversityAxes)
    setTone(state.tone ?? DEFAULT_GENERATION_FORM.tone)
    setNotes(state.notes ?? DEFAULT_GENERATION_FORM.notes)
    setCount(Math.min(30, Math.max(1, Number(state.count ?? DEFAULT_GENERATION_FORM.count) || DEFAULT_GENERATION_FORM.count)))
  }

  useEffect(() => {
    if (!open) return
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) applyFormState(JSON.parse(saved) as Partial<GenerationFormState>)
    } catch {
      // Ignore corrupted local form cache; the user can continue with defaults.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, storageKey])

  useEffect(() => {
    if (!open || preview) return
    localStorage.setItem(storageKey, JSON.stringify(currentFormState()))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, storageKey, audience, market, productContext, researchGoal, mustInclude, mustAvoid, diversityAxes, tone, notes, count, preview])

  function distribution(key: 'nivelIngreso' | 'disposicionBase' | 'pais' | 'genero') {
    const counts = new Map<string, number>()
    for (const p of preview ?? []) counts.set(String(p[key] || 'sin dato'), (counts.get(String(p[key] || 'sin dato')) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }

  async function handleGenerate() {
    if (!canGenerate) return
    setLoading(true)
    setError(null)
    try {
      const result = await api.personas.generatePreview({
        workspaceId,
        panelId,
        count,
        audience,
        market,
        productContext,
        researchGoal,
        mustInclude,
        mustAvoid,
        diversityAxes,
        tone,
        notes,
        batchNonce: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        provider,
        model: model ?? undefined
      })
      setPreview(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm() {
    if (!preview || preview.length === 0) return
    setSaving(true)
    try {
      await api.personas.saveBulk(panelId, preview)
      setOpen(false)
      setPreview(null)
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  function removeAt(idx: number) {
    setPreview((prev) => prev?.filter((_, i) => i !== idx) ?? null)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) {
          setPreview(null)
          setError(null)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Sparkles size={14} /> {t('genAi.button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogTitle>{t('genAi.title')}</DialogTitle>

        {!preview ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="audience">{t('genAi.audienceLabel')}</Label>
                <Textarea
                  id="audience"
                  className="mt-1.5"
                  rows={3}
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder={t('genAi.audiencePlaceholder')}
                />
              </div>
              <div>
                <Label htmlFor="productContext">{t('genAi.productLabel')}</Label>
                <Textarea
                  id="productContext"
                  className="mt-1.5"
                  rows={3}
                  value={productContext}
                  onChange={(e) => setProductContext(e.target.value)}
                  placeholder={t('genAi.productPlaceholder')}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="market">{t('genAi.marketLabel')}</Label>
                <Input id="market" className="mt-1.5" value={market} onChange={(e) => setMarket(e.target.value)} placeholder={t('genAi.marketPlaceholder')} />
              </div>
              <div>
                <Label htmlFor="researchGoal">{t('genAi.goalLabel')}</Label>
                <Input
                  id="researchGoal"
                  className="mt-1.5"
                  value={researchGoal}
                  onChange={(e) => setResearchGoal(e.target.value)}
                  placeholder={t('genAi.goalPlaceholder')}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="mustInclude">{t('genAi.includeLabel')}</Label>
                <Input id="mustInclude" className="mt-1.5" value={mustInclude} onChange={(e) => setMustInclude(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="mustAvoid">{t('genAi.avoidLabel')}</Label>
                <Input id="mustAvoid" className="mt-1.5" value={mustAvoid} onChange={(e) => setMustAvoid(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="diversityAxes">{t('genAi.diversityLabel')}</Label>
              <Input
                id="diversityAxes"
                className="mt-1.5"
                value={diversityAxes}
                onChange={(e) => setDiversityAxes(e.target.value)}
                placeholder={t('genAi.diversityPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="notes">{t('genAi.notesLabel')}</Label>
              <Textarea
                id="notes"
                className="mt-1.5"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('genAi.notesPlaceholder')}
              />
            </div>
            <div className="grid grid-cols-[8rem_1fr] gap-3">
              <div>
                <Label htmlFor="count">{t('genAi.countLabel')}</Label>
                <Input
                  id="count"
                  type="number"
                  min={1}
                  max={30}
                  className="mt-1.5"
                  value={count}
                  onChange={(e) => setCount(Math.min(30, Math.max(1, Number(e.target.value) || 1)))}
                />
              </div>
              <div>
                <Label htmlFor="tone">{t('genAi.toneLabel')}</Label>
                <Input id="tone" className="mt-1.5" value={tone} onChange={(e) => setTone(e.target.value)} />
              </div>
            </div>
            {error && <div className="text-xs text-danger">{error}</div>}
            <Button className="w-full" onClick={handleGenerate} disabled={loading || !canGenerate}>
              {loading ? t('genAi.generating') : t('genAi.generate', { count })}
            </Button>
          </div>
        ) : editingIndex !== null ? (
          <PersonaForm
            initial={preview[editingIndex]}
            submitLabel={t('personaDetail.saveChanges')}
            onSubmit={(draft) => {
              setPreview((prev) => prev!.map((p, i) => (i === editingIndex ? draft : p)))
              setEditingIndex(null)
            }}
          />
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-text-muted">{t('genAi.reviewHint', { count: preview.length })}</div>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-surface p-3 text-xs text-text-muted sm:grid-cols-4">
              {(['nivelIngreso', 'disposicionBase', 'pais', 'genero'] as const).map((key) => (
                <div key={key}>
                  <div className="mb-1 font-mono-label text-[10px] uppercase text-text-dim">{t(`genAi.diversity.${key}`)}</div>
                  <div className="space-y-0.5">
                    {distribution(key).map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-2">
                        <span className="truncate">{label}</span>
                        <span className="font-semibold text-text">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {preview.map((p, idx) => (
                <div key={idx} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-bg p-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-text">
                      {p.nombre} <span className="font-normal text-text-dim">· {p.edad} {t('personaDetail.years')}</span>
                    </div>
                    <div className="truncate text-xs text-text-muted">
                      {p.ocupacion} · {p.ciudad}, {p.pais} · {p.disposicionBase}
                    </div>
                  </div>
                  <div className="flex flex-none gap-1">
                    <button className="rounded p-1.5 text-text-dim hover:text-text" onClick={() => setEditingIndex(idx)}>
                      <Pencil size={13} />
                    </button>
                    <button className="rounded p-1.5 text-text-dim hover:text-danger" onClick={() => removeAt(idx)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setPreview(null)}>
                {t('genAi.back')}
              </Button>
              <Button className="flex-1" onClick={handleConfirm} disabled={saving || preview.length === 0}>
                {saving ? t('genAi.saving') : t('genAi.save', { count: preview.length })}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
