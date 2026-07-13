import { eq, desc } from 'drizzle-orm'
import { getDb } from '../client'
import { followUps, followUpRespuestas } from '../schema'
import { newId, now } from '../ids'
import { getPersona } from './personas'
import type { FollowUp, FollowUpRespuesta, FollowUpRespuestaConPersona, FollowUpResultSummary } from '@shared/types'

function toFollowUp(row: typeof followUps.$inferSelect): FollowUp {
  return {
    id: row.id,
    testId: row.testId,
    pregunta: row.pregunta,
    personaIdsIncluidas: JSON.parse(row.personaIdsIncluidasJson) as string[],
    createdAt: row.createdAt
  }
}

function toFollowUpRespuesta(row: typeof followUpRespuestas.$inferSelect): FollowUpRespuesta {
  return {
    id: row.id,
    followUpId: row.followUpId,
    personaId: row.personaId,
    respuestaTexto: row.respuestaTexto,
    createdAt: row.createdAt
  }
}

export function createFollowUp(testId: string, pregunta: string, personaIds: string[]): FollowUp {
  const row = {
    id: newId(),
    testId,
    pregunta,
    personaIdsIncluidasJson: JSON.stringify(personaIds),
    createdAt: now()
  }
  getDb().insert(followUps).values(row).run()
  return toFollowUp(row)
}

export function saveFollowUpRespuesta(followUpId: string, personaId: string, respuestaTexto: string): FollowUpRespuesta {
  const row = { id: newId(), followUpId, personaId, respuestaTexto, createdAt: now() }
  getDb().insert(followUpRespuestas).values(row).run()
  return toFollowUpRespuesta(row)
}

export function listFollowUpsForTest(testId: string): FollowUp[] {
  const rows = getDb().select().from(followUps).where(eq(followUps.testId, testId)).orderBy(desc(followUps.createdAt)).all()
  return rows.map(toFollowUp)
}

export function getFollowUpResults(followUpId: string): FollowUpResultSummary | null {
  const row = getDb().select().from(followUps).where(eq(followUps.id, followUpId)).get()
  if (!row) return null
  const followUp = toFollowUp(row)
  const respuestaRows = getDb().select().from(followUpRespuestas).where(eq(followUpRespuestas.followUpId, followUpId)).all()
  const respuestas: FollowUpRespuestaConPersona[] = respuestaRows
    .map(toFollowUpRespuesta)
    .map((r) => {
      const persona = getPersona(r.personaId)
      return persona ? { ...r, persona } : null
    })
    .filter((r): r is FollowUpRespuestaConPersona => r !== null)
  return { followUp, respuestas }
}
