import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import type { PersonaDraft } from '@shared/types'
import { DISPOSICIONES, NIVELES_INGRESO } from '@shared/types'
import { api } from '@renderer/lib/api'
import { useAppStore } from '@renderer/store/useAppStore'
import { Input } from '@renderer/components/ui/input'
import { Textarea } from '@renderer/components/ui/textarea'
import { Label } from '@renderer/components/ui/label'
import { Button } from '@renderer/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@renderer/components/ui/select'
import { tagsToString, stringToTags } from '@renderer/lib/csv'
import { useT } from '@renderer/i18n/useT'

const EMPTY: PersonaDraft = {
  nombre: '',
  edad: 30,
  genero: '',
  ciudad: '',
  pais: '',
  ocupacion: '',
  nivelIngreso: 'medio',
  nivelEducativo: '',
  estadoCivil: '',
  disposicionBase: 'neutro',
  rasgos: [],
  valores: [],
  historiaPersonal: '',
  objecionesTipicas: [],
  canalPreferido: '',
  llmProviderOverride: null,
  llmModelOverride: null
}

export function PersonaForm({
  initial,
  onSubmit,
  submitLabel,
  workspaceId,
  enableAiImprove = false
}: {
  initial?: Partial<PersonaDraft>
  onSubmit: (draft: PersonaDraft) => void | Promise<void>
  submitLabel?: string
  workspaceId?: string
  enableAiImprove?: boolean
}) {
  const [draft, setDraft] = useState<PersonaDraft>({ ...EMPTY, ...initial })
  const [saving, setSaving] = useState(false)
  const [improving, setImproving] = useState(false)
  const [improveInstructions, setImproveInstructions] = useState('')
  const provider = useAppStore((s) => s.currentProvider)
  const model = useAppStore((s) => s.currentModel)
  const t = useT()
  const resolvedSubmitLabel = submitLabel ?? t('personaForm.save')

  function set<K extends keyof PersonaDraft>(key: K, value: PersonaDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit() {
    if (!draft.nombre.trim()) return
    setSaving(true)
    try {
      await onSubmit(draft)
    } finally {
      setSaving(false)
    }
  }

  async function handleImprove() {
    if (!workspaceId) return
    setImproving(true)
    try {
      const improved = await api.personas.improveDraft({
        workspaceId,
        draft,
        instructions: improveInstructions,
        provider,
        model: model ?? undefined
      })
      setDraft({ ...draft, ...improved })
    } finally {
      setImproving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="p-nombre">{t('personaForm.nombre')}</Label>
          <Input id="p-nombre" className="mt-1.5" value={draft.nombre} onChange={(e) => set('nombre', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="p-edad">{t('personaForm.edad')}</Label>
          <Input
            id="p-edad"
            type="number"
            className="mt-1.5"
            value={draft.edad}
            onChange={(e) => set('edad', Number(e.target.value) || 0)}
          />
        </div>
        <div>
          <Label htmlFor="p-genero">{t('personaForm.genero')}</Label>
          <Input id="p-genero" className="mt-1.5" value={draft.genero} onChange={(e) => set('genero', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="p-ciudad">{t('personaForm.ciudad')}</Label>
          <Input id="p-ciudad" className="mt-1.5" value={draft.ciudad} onChange={(e) => set('ciudad', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="p-pais">{t('personaForm.pais')}</Label>
          <Input id="p-pais" className="mt-1.5" value={draft.pais} onChange={(e) => set('pais', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="p-ocupacion">{t('personaForm.ocupacion')}</Label>
          <Input id="p-ocupacion" className="mt-1.5" value={draft.ocupacion} onChange={(e) => set('ocupacion', e.target.value)} />
        </div>
        <div>
          <Label>{t('personaForm.nivelIngreso')}</Label>
          <Select value={draft.nivelIngreso} onValueChange={(v) => set('nivelIngreso', v as PersonaDraft['nivelIngreso'])}>
            <SelectTrigger className="mt-1.5 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NIVELES_INGRESO.map((n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t('personaForm.disposicionBase')}</Label>
          <Select value={draft.disposicionBase} onValueChange={(v) => set('disposicionBase', v as PersonaDraft['disposicionBase'])}>
            <SelectTrigger className="mt-1.5 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DISPOSICIONES.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="p-educ">{t('personaForm.nivelEducativo')}</Label>
          <Input id="p-educ" className="mt-1.5" value={draft.nivelEducativo} onChange={(e) => set('nivelEducativo', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="p-civil">{t('personaForm.estadoCivil')}</Label>
          <Input id="p-civil" className="mt-1.5" value={draft.estadoCivil} onChange={(e) => set('estadoCivil', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="p-canal">{t('personaForm.canalPreferido')}</Label>
          <Input id="p-canal" className="mt-1.5" value={draft.canalPreferido} onChange={(e) => set('canalPreferido', e.target.value)} />
        </div>
      </div>

      <div>
        <Label htmlFor="p-rasgos">{t('personaForm.rasgos')}</Label>
        <Input
          id="p-rasgos"
          className="mt-1.5"
          value={tagsToString(draft.rasgos)}
          onChange={(e) => set('rasgos', stringToTags(e.target.value))}
        />
      </div>
      <div>
        <Label htmlFor="p-valores">{t('personaForm.valores')}</Label>
        <Input
          id="p-valores"
          className="mt-1.5"
          value={tagsToString(draft.valores)}
          onChange={(e) => set('valores', stringToTags(e.target.value))}
        />
      </div>
      <div>
        <Label htmlFor="p-objeciones">{t('personaForm.objeciones')}</Label>
        <Input
          id="p-objeciones"
          className="mt-1.5"
          value={tagsToString(draft.objecionesTipicas)}
          onChange={(e) => set('objecionesTipicas', stringToTags(e.target.value))}
        />
      </div>
      <div>
        <Label htmlFor="p-historia">{t('personaForm.historia')}</Label>
        <Textarea
          id="p-historia"
          className="mt-1.5"
          rows={4}
          value={draft.historiaPersonal}
          onChange={(e) => set('historiaPersonal', e.target.value)}
        />
      </div>

      {enableAiImprove && workspaceId && (
        <div className="rounded-lg border border-border bg-surface p-3">
          <Label htmlFor="p-improve">{t('personaForm.aiImproveLabel')}</Label>
          <Textarea
            id="p-improve"
            className="mt-1.5"
            rows={2}
            value={improveInstructions}
            onChange={(e) => setImproveInstructions(e.target.value)}
            placeholder={t('personaForm.aiImprovePlaceholder')}
          />
          <Button variant="secondary" className="mt-2 w-full" onClick={handleImprove} disabled={improving}>
            <Sparkles size={14} /> {improving ? t('personaForm.aiImproving') : t('personaForm.aiImprove')}
          </Button>
        </div>
      )}

      <Button className="w-full" onClick={handleSubmit} disabled={saving || !draft.nombre.trim()}>
        {saving ? t('personaForm.saving') : resolvedSubmitLabel}
      </Button>
    </div>
  )
}
