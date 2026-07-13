import { eq } from 'drizzle-orm'
import { getDb } from '../client'
import { temasTest } from '../schema'
import { newId, now } from '../ids'
import type { TemaTest } from '@shared/types'
import type { LocalTema } from '../../llm/local/temasExtractor'

function toTema(row: typeof temasTest.$inferSelect): TemaTest {
  return {
    id: row.id,
    testId: row.testId,
    nombreTema: row.nombreTema,
    cantidadMenciones: row.cantidadMenciones,
    personasRepresentativas: JSON.parse(row.personasRepresentativasJson) as TemaTest['personasRepresentativas'],
    createdAt: row.createdAt
  }
}

export function saveTemas(testId: string, temas: LocalTema[]): TemaTest[] {
  const db = getDb()
  db.delete(temasTest).where(eq(temasTest.testId, testId)).run()
  return temas.map((t) => {
    const row = {
      id: newId(),
      testId,
      nombreTema: t.nombre,
      cantidadMenciones: t.cantidadMenciones,
      personasRepresentativasJson: JSON.stringify(
        t.representativas.map((r) => ({ personaId: r.personaId, quote: r.quote }))
      ),
      createdAt: now()
    }
    db.insert(temasTest).values(row).run()
    return toTema(row)
  })
}

export function listTemas(testId: string): TemaTest[] {
  const rows = getDb().select().from(temasTest).where(eq(temasTest.testId, testId)).all()
  return rows.map(toTema)
}
