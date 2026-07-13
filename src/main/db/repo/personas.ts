import { eq } from 'drizzle-orm'
import { getDb } from '../client'
import { personas } from '../schema'
import { newId, now } from '../ids'
import type { Persona, PersonaDraft } from '@shared/types'
import { createPersonaVersion } from './personaVersions'
import { diffPersonaSnapshots, toSnapshot } from '../../analytics/personaDiff'

function toPersona(row: typeof personas.$inferSelect): Persona {
  return {
    id: row.id,
    panelId: row.panelId,
    nombre: row.nombre,
    edad: row.edad,
    genero: row.genero,
    ciudad: row.ciudad,
    pais: row.pais,
    ocupacion: row.ocupacion,
    nivelIngreso: row.nivelIngreso as Persona['nivelIngreso'],
    nivelEducativo: row.nivelEducativo,
    estadoCivil: row.estadoCivil,
    disposicionBase: row.disposicionBase as Persona['disposicionBase'],
    rasgos: JSON.parse(row.rasgosJson) as string[],
    valores: JSON.parse(row.valoresJson) as string[],
    historiaPersonal: row.historiaPersonal,
    objecionesTipicas: JSON.parse(row.objecionesTipicasJson) as string[],
    canalPreferido: row.canalPreferido,
    avatarSeed: row.avatarSeed,
    avatarImageDataUri: row.avatarImageDataUri,
    llmProviderOverride: (row.llmProviderOverride as Persona['llmProviderOverride']) ?? null,
    llmModelOverride: row.llmModelOverride,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

export function listPersonas(panelId: string): Persona[] {
  const rows = getDb().select().from(personas).where(eq(personas.panelId, panelId)).all()
  return rows.map(toPersona).sort((a, b) => a.nombre.localeCompare(b.nombre))
}

export function listPersonasByIds(ids: string[]): Persona[] {
  if (ids.length === 0) return []
  const all = getDb().select().from(personas).all()
  const set = new Set(ids)
  return all.filter((r) => set.has(r.id)).map(toPersona)
}

export function getPersona(id: string): Persona | null {
  const row = getDb().select().from(personas).where(eq(personas.id, id)).get()
  return row ? toPersona(row) : null
}

export function createPersona(panelId: string, draft: PersonaDraft): Persona {
  const timestamp = now()
  const row = {
    id: newId(),
    panelId,
    nombre: draft.nombre,
    edad: draft.edad,
    genero: draft.genero,
    ciudad: draft.ciudad,
    pais: draft.pais,
    ocupacion: draft.ocupacion,
    nivelIngreso: draft.nivelIngreso,
    nivelEducativo: draft.nivelEducativo,
    estadoCivil: draft.estadoCivil,
    disposicionBase: draft.disposicionBase,
    rasgosJson: JSON.stringify(draft.rasgos ?? []),
    valoresJson: JSON.stringify(draft.valores ?? []),
    historiaPersonal: draft.historiaPersonal ?? '',
    objecionesTipicasJson: JSON.stringify(draft.objecionesTipicas ?? []),
    canalPreferido: draft.canalPreferido ?? '',
    avatarSeed: draft.avatarSeed ?? `${draft.nombre}-${newId()}`,
    avatarImageDataUri: draft.avatarImageDataUri ?? null,
    llmProviderOverride: draft.llmProviderOverride ?? null,
    llmModelOverride: draft.llmModelOverride ?? null,
    createdAt: timestamp,
    updatedAt: timestamp
  }
  getDb().insert(personas).values(row).run()
  const persona = toPersona(row)
  createPersonaVersion(persona.id, toSnapshot(persona), 'Versión inicial', persona.createdAt)
  return persona
}

export function createPersonasBulk(panelId: string, drafts: PersonaDraft[]): Persona[] {
  return drafts.map((d) => createPersona(panelId, d))
}

export function updatePersona(id: string, draft: Partial<PersonaDraft>): Persona {
  const before = getPersona(id)
  if (!before) throw new Error('Persona no encontrada')

  const patch: Record<string, unknown> = { updatedAt: now() }
  if (draft.nombre !== undefined) patch.nombre = draft.nombre
  if (draft.edad !== undefined) patch.edad = draft.edad
  if (draft.genero !== undefined) patch.genero = draft.genero
  if (draft.ciudad !== undefined) patch.ciudad = draft.ciudad
  if (draft.pais !== undefined) patch.pais = draft.pais
  if (draft.ocupacion !== undefined) patch.ocupacion = draft.ocupacion
  if (draft.nivelIngreso !== undefined) patch.nivelIngreso = draft.nivelIngreso
  if (draft.nivelEducativo !== undefined) patch.nivelEducativo = draft.nivelEducativo
  if (draft.estadoCivil !== undefined) patch.estadoCivil = draft.estadoCivil
  if (draft.disposicionBase !== undefined) patch.disposicionBase = draft.disposicionBase
  if (draft.rasgos !== undefined) patch.rasgosJson = JSON.stringify(draft.rasgos)
  if (draft.valores !== undefined) patch.valoresJson = JSON.stringify(draft.valores)
  if (draft.historiaPersonal !== undefined) patch.historiaPersonal = draft.historiaPersonal
  if (draft.objecionesTipicas !== undefined) patch.objecionesTipicasJson = JSON.stringify(draft.objecionesTipicas)
  if (draft.canalPreferido !== undefined) patch.canalPreferido = draft.canalPreferido
  if (draft.avatarImageDataUri !== undefined) patch.avatarImageDataUri = draft.avatarImageDataUri
  if (draft.llmProviderOverride !== undefined) patch.llmProviderOverride = draft.llmProviderOverride
  if (draft.llmModelOverride !== undefined) patch.llmModelOverride = draft.llmModelOverride

  getDb().update(personas).set(patch).where(eq(personas.id, id)).run()
  const after = getPersona(id)
  if (!after) throw new Error('Persona no encontrada')

  const diffResumen = diffPersonaSnapshots(toSnapshot(before), toSnapshot(after))
  if (diffResumen !== 'Sin cambios detectados.') {
    createPersonaVersion(after.id, toSnapshot(after), diffResumen)
  }

  return after
}

export function deletePersona(id: string): void {
  getDb().delete(personas).where(eq(personas.id, id)).run()
}
