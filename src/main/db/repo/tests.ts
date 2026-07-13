import { eq, desc } from 'drizzle-orm'
import { getDb } from '../client'
import { tests, respuestas } from '../schema'
import { newId, now } from '../ids'
import { getPersona } from './personas'
import type {
  ConfianzaBreakdown,
  CrowdmindTest,
  EstimuloMetadata,
  EstimuloTipo,
  ModoInteraccion,
  Respuesta,
  RespuestaConPersona,
  TestResultSummary,
  TestTipo
} from '@shared/types'
import { sentimentBucket } from '@shared/types'

function toTest(row: typeof tests.$inferSelect): CrowdmindTest {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    panelId: row.panelId,
    nombre: row.nombre,
    tipo: row.tipo as TestTipo,
    modoInteraccion: row.modoInteraccion as ModoInteraccion,
    estimuloTipo: row.estimuloTipo as EstimuloTipo,
    estimuloContenido: row.estimuloContenido,
    estimuloMetadata: JSON.parse(row.estimuloMetadataJson) as EstimuloMetadata,
    scorecardCriteria: JSON.parse(row.scorecardCriteriaJson ?? '[]') as string[],
    resumenEjecutivo: row.resumenEjecutivo,
    disclaimers: JSON.parse(row.disclaimersJson) as string[],
    indiceConfianza: row.indiceConfianza,
    confianzaBreakdown: row.confianzaBreakdownJson ? (JSON.parse(row.confianzaBreakdownJson) as ConfianzaBreakdown) : null,
    createdAt: row.createdAt
  }
}

function toRespuesta(row: typeof respuestas.$inferSelect): Respuesta {
  return {
    id: row.id,
    testId: row.testId,
    personaId: row.personaId,
    etapaFunnelId: row.etapaFunnelId,
    avanzoASiguienteEtapa: row.avanzoASiguienteEtapa,
    personaVersionId: row.personaVersionId,
    scoreSatisfaccion: row.scoreSatisfaccion,
    scorecardScores: JSON.parse(row.scorecardScoresJson ?? '{}') as Record<string, number>,
    opinionTexto: row.opinionTexto,
    objeciones: JSON.parse(row.objecionesJson) as string[],
    aspectosPositivos: JSON.parse(row.aspectosPositivosJson) as string[],
    modeloUsadoProvider: row.modeloUsadoProvider as Respuesta['modeloUsadoProvider'],
    modeloUsadoModel: row.modeloUsadoModel,
    createdAt: row.createdAt
  }
}

export function listTests(panelId: string): CrowdmindTest[] {
  const rows = getDb().select().from(tests).where(eq(tests.panelId, panelId)).orderBy(desc(tests.createdAt)).all()
  return rows.map(toTest)
}

export function getTest(id: string): CrowdmindTest | null {
  const row = getDb().select().from(tests).where(eq(tests.id, id)).get()
  return row ? toTest(row) : null
}

export function createTest(input: {
  workspaceId: string
  panelId: string
  nombre: string
  tipo?: TestTipo
  modoInteraccion?: ModoInteraccion
  estimuloTipo: EstimuloTipo
  estimuloContenido: string
  estimuloMetadata?: EstimuloMetadata
  scorecardCriteria?: string[]
}): CrowdmindTest {
  const row = {
    id: newId(),
    workspaceId: input.workspaceId,
    panelId: input.panelId,
    nombre: input.nombre.trim() || 'Test sin título',
    tipo: input.tipo ?? 'simple',
    modoInteraccion: input.modoInteraccion ?? 'individual',
    estimuloTipo: input.estimuloTipo,
    estimuloContenido: input.estimuloContenido,
    estimuloMetadataJson: JSON.stringify(input.estimuloMetadata ?? {}),
    scorecardCriteriaJson: JSON.stringify(input.scorecardCriteria ?? []),
    resumenEjecutivo: null,
    disclaimersJson: '[]',
    indiceConfianza: null,
    confianzaBreakdownJson: null,
    createdAt: now()
  }
  getDb().insert(tests).values(row).run()
  return toTest(row)
}

export function setResumenEjecutivo(testId: string, resumen: string): void {
  getDb().update(tests).set({ resumenEjecutivo: resumen }).where(eq(tests.id, testId)).run()
}

export function setConfianza(testId: string, indiceConfianza: number, disclaimers: string[], breakdown: ConfianzaBreakdown): void {
  getDb()
    .update(tests)
    .set({ indiceConfianza, disclaimersJson: JSON.stringify(disclaimers), confianzaBreakdownJson: JSON.stringify(breakdown) })
    .where(eq(tests.id, testId))
    .run()
}

export function saveRespuesta(
  input: Omit<Respuesta, 'id' | 'createdAt' | 'etapaFunnelId' | 'avanzoASiguienteEtapa' | 'personaVersionId' | 'scorecardScores'> &
    Partial<Pick<Respuesta, 'etapaFunnelId' | 'avanzoASiguienteEtapa' | 'personaVersionId' | 'scorecardScores'>>
): Respuesta {
  const row = {
    id: newId(),
    testId: input.testId,
    personaId: input.personaId,
    etapaFunnelId: input.etapaFunnelId ?? null,
    avanzoASiguienteEtapa: input.avanzoASiguienteEtapa ?? null,
    personaVersionId: input.personaVersionId ?? null,
    scoreSatisfaccion: input.scoreSatisfaccion,
    scorecardScoresJson: JSON.stringify(input.scorecardScores ?? {}),
    opinionTexto: input.opinionTexto,
    objecionesJson: JSON.stringify(input.objeciones ?? []),
    aspectosPositivosJson: JSON.stringify(input.aspectosPositivos ?? []),
    modeloUsadoProvider: input.modeloUsadoProvider,
    modeloUsadoModel: input.modeloUsadoModel,
    createdAt: now()
  }
  getDb().insert(respuestas).values(row).run()
  return toRespuesta(row)
}

export function listRespuestasForTest(testId: string): RespuestaConPersona[] {
  const rows = getDb().select().from(respuestas).where(eq(respuestas.testId, testId)).all()
  return rows
    .map(toRespuesta)
    .map((r) => {
      const persona = getPersona(r.personaId)
      return persona ? { ...r, persona } : null
    })
    .filter((r): r is RespuestaConPersona => r !== null)
}

export function getTestResults(testId: string): TestResultSummary | null {
  const test = getTest(testId)
  if (!test) return null
  const respuestasConPersona = listRespuestasForTest(testId).filter((r) => !r.etapaFunnelId)

  const scores = respuestasConPersona.map((r) => r.scoreSatisfaccion)
  const scorePromedio = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

  const distribucion = { positivo: 0, neutro: 0, negativo: 0 }
  for (const r of respuestasConPersona) {
    distribucion[sentimentBucket(r.scoreSatisfaccion)]++
  }

  const scorecardPromedios: Record<string, number> = {}
  for (const criterio of test.scorecardCriteria) {
    const values = respuestasConPersona
      .map((r) => r.scorecardScores[criterio])
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
    if (values.length) scorecardPromedios[criterio] = values.reduce((a, b) => a + b, 0) / values.length
  }

  const previous = listTests(test.panelId)
    .filter((t) => t.id !== test.id && t.createdAt < test.createdAt)
    .map((t) => {
      const r = listRespuestasForTest(t.id).filter((x) => !x.etapaFunnelId)
      const s = r.map((x) => x.scoreSatisfaccion)
      return s.length ? s.reduce((a, b) => a + b, 0) / s.length : null
    })
    .filter((v): v is number => v !== null)
  const previousAverage = previous.length ? previous.reduce((a, b) => a + b, 0) / previous.length : null
  const benchmark = {
    previousTests: previous.length,
    previousAverage,
    delta: previousAverage === null ? null : scorePromedio - previousAverage
  }

  return { test, respuestas: respuestasConPersona, scorePromedio, distribucion, scorecardPromedios, benchmark }
}
