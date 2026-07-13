import { eq, desc } from 'drizzle-orm'
import { getDb } from '../client'
import { personaVersiones, respuestas, tests } from '../schema'
import { newId, now } from '../ids'
import type { PersonaSnapshot, PersonaVersion } from '@shared/types'

function toVersion(row: typeof personaVersiones.$inferSelect): PersonaVersion {
  return {
    id: row.id,
    personaId: row.personaId,
    snapshot: JSON.parse(row.snapshotJson) as PersonaSnapshot,
    diffResumen: row.diffResumen,
    createdAt: row.createdAt
  }
}

export function createPersonaVersion(personaId: string, snapshot: PersonaSnapshot, diffResumen: string, createdAt?: number): PersonaVersion {
  const row = {
    id: newId(),
    personaId,
    snapshotJson: JSON.stringify(snapshot),
    diffResumen,
    createdAt: createdAt ?? now()
  }
  getDb().insert(personaVersiones).values(row).run()
  return toVersion(row)
}

export function listPersonaVersions(personaId: string): PersonaVersion[] {
  const rows = getDb()
    .select()
    .from(personaVersiones)
    .where(eq(personaVersiones.personaId, personaId))
    .orderBy(desc(personaVersiones.createdAt))
    .all()
  return rows.map(toVersion)
}

export function getLatestPersonaVersionId(personaId: string): string | null {
  const row = getDb()
    .select()
    .from(personaVersiones)
    .where(eq(personaVersiones.personaId, personaId))
    .orderBy(desc(personaVersiones.createdAt))
    .limit(1)
    .get()
  return row?.id ?? null
}

export function listTestNamesUsingVersion(versionId: string): Array<{ testId: string; testNombre: string }> {
  const rows = getDb()
    .select({ testId: tests.id, testNombre: tests.nombre })
    .from(respuestas)
    .innerJoin(tests, eq(respuestas.testId, tests.id))
    .where(eq(respuestas.personaVersionId, versionId))
    .all()
  const seen = new Map<string, string>()
  for (const r of rows) seen.set(r.testId, r.testNombre)
  return [...seen.entries()].map(([testId, testNombre]) => ({ testId, testNombre }))
}
