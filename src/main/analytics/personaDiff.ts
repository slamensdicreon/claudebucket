import type { PersonaSnapshot } from '@shared/types'

const FIELD_LABELS: Partial<Record<keyof PersonaSnapshot, string>> = {
  nombre: 'nombre',
  edad: 'edad',
  genero: 'género',
  ciudad: 'ciudad',
  pais: 'país',
  ocupacion: 'ocupación',
  nivelIngreso: 'nivel_ingreso',
  nivelEducativo: 'nivel_educativo',
  estadoCivil: 'estado_civil',
  disposicionBase: 'disposicion_base',
  canalPreferido: 'canal_preferido'
}

const SCALAR_FIELDS = Object.keys(FIELD_LABELS) as Array<keyof PersonaSnapshot>
const ARRAY_FIELDS: Array<{ key: keyof PersonaSnapshot; label: string }> = [
  { key: 'rasgos', label: 'rasgos' },
  { key: 'valores', label: 'valores' },
  { key: 'objecionesTipicas', label: 'objeciones_tipicas' }
]

function arraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

/** Plain field-by-field comparison, no AI — produces a short human-readable summary of what changed. */
export function diffPersonaSnapshots(prev: PersonaSnapshot, next: PersonaSnapshot): string {
  const changes: string[] = []

  for (const key of SCALAR_FIELDS) {
    if (prev[key] !== next[key]) {
      changes.push(`${FIELD_LABELS[key]}: ${String(prev[key])} → ${String(next[key])}`)
    }
  }

  for (const { key, label } of ARRAY_FIELDS) {
    const prevArr = prev[key] as string[]
    const nextArr = next[key] as string[]
    if (!arraysEqual(prevArr, nextArr)) {
      changes.push(`${label}: editado (${prevArr.length} → ${nextArr.length} elementos)`)
    }
  }

  if (prev.historiaPersonal !== next.historiaPersonal) {
    const prevLen = prev.historiaPersonal.length
    const nextLen = next.historiaPersonal.length
    const delta = nextLen - prevLen
    changes.push(`historia_personal: editada (${delta >= 0 ? '+' : ''}${delta} caracteres)`)
  }

  if (changes.length === 0) return 'Sin cambios detectados.'
  return changes.join('; ')
}

export function toSnapshot(persona: {
  nombre: string
  edad: number
  genero: string
  ciudad: string
  pais: string
  ocupacion: string
  nivelIngreso: PersonaSnapshot['nivelIngreso']
  nivelEducativo: string
  estadoCivil: string
  disposicionBase: PersonaSnapshot['disposicionBase']
  rasgos: string[]
  valores: string[]
  historiaPersonal: string
  objecionesTipicas: string[]
  canalPreferido: string
  avatarSeed: string
  avatarImageDataUri: string | null
  llmProviderOverride: PersonaSnapshot['llmProviderOverride']
  llmModelOverride: string | null
}): PersonaSnapshot {
  return { ...persona }
}
