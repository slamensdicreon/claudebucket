import { eq, asc } from 'drizzle-orm'
import { getDb } from '../client'
import { etapasFunnel } from '../schema'
import { newId, now } from '../ids'
import type { EstimuloMetadata, EstimuloTipo, EtapaFunnel, EtapaFunnelDraft, FunnelResultSummary } from '@shared/types'
import { getTest, listRespuestasForTest } from './tests'

function toEtapa(row: typeof etapasFunnel.$inferSelect): EtapaFunnel {
  return {
    id: row.id,
    testId: row.testId,
    orden: row.orden,
    tipoEstimulo: row.tipoEstimulo as EstimuloTipo,
    estimuloContenido: row.estimuloContenido,
    estimuloMetadata: JSON.parse(row.estimuloMetadataJson) as EstimuloMetadata,
    titulo: row.titulo,
    createdAt: row.createdAt
  }
}

export function createEtapas(testId: string, drafts: EtapaFunnelDraft[]): EtapaFunnel[] {
  const db = getDb()
  return drafts.map((d, i) => {
    const row = {
      id: newId(),
      testId,
      orden: d.orden ?? i,
      tipoEstimulo: d.tipoEstimulo,
      estimuloContenido: d.estimuloContenido,
      estimuloMetadataJson: JSON.stringify(d.estimuloMetadata ?? {}),
      titulo: d.titulo || `Etapa ${i + 1}`,
      createdAt: now()
    }
    db.insert(etapasFunnel).values(row).run()
    return toEtapa(row)
  })
}

export function listEtapas(testId: string): EtapaFunnel[] {
  const rows = getDb().select().from(etapasFunnel).where(eq(etapasFunnel.testId, testId)).orderBy(asc(etapasFunnel.orden)).all()
  return rows.map(toEtapa)
}

export function getFunnelResults(testId: string): FunnelResultSummary | null {
  const test = getTest(testId)
  if (!test) return null
  const etapas = listEtapas(testId)
  const todasLasRespuestas = listRespuestasForTest(testId)

  const stages = etapas.map((etapa) => {
    const respuestas = todasLasRespuestas.filter((r) => r.etapaFunnelId === etapa.id)
    const avanzaron = respuestas.filter((r) => r.avanzoASiguienteEtapa === true).length
    return { etapa, respuestas, entraron: respuestas.length, avanzaron }
  })

  return { test, etapas: stages }
}
