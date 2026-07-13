import { eq, desc } from 'drizzle-orm'
import { getDb } from '../client'
import { comparaciones, paneles, tests } from '../schema'
import { newId, now } from '../ids'
import { getTestResults } from './tests'
import type { Comparacion, ComparacionModo, ComparacionResult } from '@shared/types'

function toComparacion(row: typeof comparaciones.$inferSelect): Comparacion {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    modo: row.modo as ComparacionModo,
    testAId: row.testAId,
    testBId: row.testBId,
    createdAt: row.createdAt
  }
}

export function listTestsForWorkspace(workspaceId: string): Array<{ id: string; nombre: string; panelNombre: string }> {
  return getDb()
    .select({ id: tests.id, nombre: tests.nombre, panelNombre: paneles.nombre })
    .from(tests)
    .innerJoin(paneles, eq(tests.panelId, paneles.id))
    .where(eq(paneles.workspaceId, workspaceId))
    .orderBy(desc(tests.createdAt))
    .all()
}

export function computeComparison(comparacion: Comparacion): ComparacionResult | null {
  const testA = getTestResults(comparacion.testAId)
  const testB = getTestResults(comparacion.testBId)
  if (!testA || !testB) return null

  const scoresA = new Map(testA.respuestas.map((r) => [r.personaId, r]))
  const scoresB = new Map(testB.respuestas.map((r) => [r.personaId, r]))
  const allPersonaIds = new Set([...scoresA.keys(), ...scoresB.keys()])

  const deltas = [...allPersonaIds].map((personaId) => {
    const a = scoresA.get(personaId)
    const b = scoresB.get(personaId)
    const scoreA = a?.scoreSatisfaccion ?? null
    const scoreB = b?.scoreSatisfaccion ?? null
    return {
      personaId,
      personaNombre: (a ?? b)!.persona.nombre,
      scoreA,
      scoreB,
      delta: scoreA !== null && scoreB !== null ? scoreB - scoreA : null
    }
  })

  return { comparacion, testA, testB, deltas, scorePromedioDelta: testB.scorePromedio - testA.scorePromedio }
}

export function createComparacion(workspaceId: string, modo: ComparacionModo, testAId: string, testBId: string): Comparacion {
  const row = { id: newId(), workspaceId, modo, testAId, testBId, createdAt: now() }
  getDb().insert(comparaciones).values(row).run()
  return toComparacion(row)
}

export function listComparaciones(workspaceId: string): Comparacion[] {
  const rows = getDb().select().from(comparaciones).where(eq(comparaciones.workspaceId, workspaceId)).orderBy(desc(comparaciones.createdAt)).all()
  return rows.map(toComparacion)
}
