import fs from 'node:fs'
import Papa from 'papaparse'
import type { CsvColumnMapping, CsvPreview, DisposicionBase, NivelIngreso, PersonaDraft } from '@shared/types'
import { DISPOSICIONES, NIVELES_INGRESO } from '@shared/types'

const ARRAY_FIELDS = new Set<keyof PersonaDraft>(['rasgos', 'valores', 'objecionesTipicas'])
const NUMBER_FIELDS = new Set<keyof PersonaDraft>(['edad'])

export function readCsvPreview(filePath: string): CsvPreview {
  const content = fs.readFileSync(filePath, 'utf-8')
  const parsed = Papa.parse<Record<string, string>>(content, { header: true, skipEmptyLines: true, preview: 5 })
  return {
    filePath,
    headers: parsed.meta.fields ?? [],
    sampleRows: parsed.data
  }
}

function splitList(value: string): string[] {
  return value
    .split(/[,;]/)
    .map((v) => v.trim())
    .filter(Boolean)
}

function coerceValue(field: keyof PersonaDraft, raw: string): unknown {
  if (ARRAY_FIELDS.has(field)) return splitList(raw)
  if (NUMBER_FIELDS.has(field)) return Number(raw.replace(/[^\d.-]/g, '')) || 0
  if (field === 'nivelIngreso') {
    const match = NIVELES_INGRESO.find((n) => raw.trim().toLowerCase().startsWith(n))
    return (match ?? 'medio') as NivelIngreso
  }
  if (field === 'disposicionBase') {
    const match = DISPOSICIONES.find((d) => raw.trim().toLowerCase().startsWith(d.slice(0, 4)))
    return (match ?? 'neutro') as DisposicionBase
  }
  return raw.trim()
}

const DEFAULTS: PersonaDraft = {
  nombre: 'Sin nombre',
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

function rowToDraft(row: Record<string, string>, mapeoColumnas: CsvColumnMapping): PersonaDraft {
  const draft: PersonaDraft = { ...DEFAULTS }
  for (const [csvColumn, field] of Object.entries(mapeoColumnas)) {
    if (!field) continue
    const raw = row[csvColumn]
    if (raw === undefined || raw === '') continue
    ;(draft as Record<string, unknown>)[field] = coerceValue(field, raw)
  }
  return draft
}

function ageBucket(edad: number): string {
  if (edad < 30) return '<30'
  if (edad < 45) return '30-44'
  return '45+'
}

/**
 * Groups rows that share (nivelIngreso, disposicionBase, age bucket) into a single representative
 * persona, so a survey with hundreds of near-identical responses doesn't produce hundreds of near-
 * identical personas. The first row in each group is kept as the representative; its historia_personal
 * notes how many original rows it stands in for.
 */
function agruparFilasSimilares(drafts: PersonaDraft[]): PersonaDraft[] {
  const groups = new Map<string, PersonaDraft[]>()
  for (const d of drafts) {
    const key = `${d.nivelIngreso}::${d.disposicionBase}::${ageBucket(d.edad)}`
    const arr = groups.get(key) ?? []
    arr.push(d)
    groups.set(key, arr)
  }
  return [...groups.values()].map((group) => {
    const representative = group[0]
    if (group.length === 1) return representative
    return {
      ...representative,
      historiaPersonal: `${representative.historiaPersonal} (representa a ${group.length} personas similares del CSV importado)`.trim()
    }
  })
}

export function parseCsvToPersonaDrafts(filePath: string, mapeoColumnas: CsvColumnMapping, agruparSimilares: boolean): PersonaDraft[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const parsed = Papa.parse<Record<string, string>>(content, { header: true, skipEmptyLines: true })
  const drafts = parsed.data.map((row) => rowToDraft(row, mapeoColumnas))
  return agruparSimilares ? agruparFilasSimilares(drafts) : drafts
}
