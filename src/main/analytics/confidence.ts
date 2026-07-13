import type { RespuestaConPersona } from '@shared/types'
import { getConfidenceDisclaimersQualitative, type ProviderCall } from '../llm/useCases'
import { setConfianza } from '../db/repo/tests'

const EDAD_BUCKETS = [
  { label: '<30', test: (edad: number) => edad < 30 },
  { label: '30-44', test: (edad: number) => edad >= 30 && edad < 45 },
  { label: '45+', test: (edad: number) => edad >= 45 }
]
const NIVELES = ['bajo', 'medio', 'alto'] as const
const TOTAL_SEGMENTOS = EDAD_BUCKETS.length * NIVELES.length // 9

function segmentoDe(edad: number, nivelIngreso: string): string {
  const bucket = EDAD_BUCKETS.find((b) => b.test(edad))?.label ?? '45+'
  return `${bucket} · ${nivelIngreso}`
}

function mean(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0
  const m = mean(values)
  const variance = mean(values.map((v) => (v - m) ** 2))
  return Math.sqrt(variance)
}

export interface IndiceConfianzaBreakdown {
  indice: number
  tamanoMuestra: number
  desviacionScores: number
  segmentosCubiertos: number
  segmentosTotales: number
  disclaimersReglas: string[]
}

/**
 * Rule-based confidence/diversity score, 0-100. This is intentionally simple and fully auditable —
 * it is NOT a rigorous statistical measure, just three signals combined with fixed weights:
 *
 *  1. Sample size   (up to -40 points): fewer than 5 respondents is a hard penalty, <10 a smaller one.
 *  2. Score variance (up to -30 points): a standard deviation below ~1.0 on a 1-10 scale suggests an
 *     "echo chamber" — the panel may not be diverse enough in outlook to trust the aggregate.
 *  3. Demographic coverage (up to -30 points): fraction of the 9 (age-bucket × income-level) segments
 *     that have at least one respondent, scaled linearly.
 *
 * Score starts at 100 and these penalties are subtracted, then clamped to [0, 100].
 */
export function calcularIndiceConfianzaDeRespuestas(respuestas: RespuestaConPersona[]): IndiceConfianzaBreakdown {
  const tamanoMuestra = respuestas.length
  const scores = respuestas.map((r) => r.scoreSatisfaccion)
  const desviacionScores = stdDev(scores)

  const segmentosPresentes = new Set(respuestas.map((r) => segmentoDe(r.persona.edad, r.persona.nivelIngreso)))
  const segmentosCubiertos = segmentosPresentes.size

  let indice = 100
  const disclaimersReglas: string[] = []

  if (tamanoMuestra < 5) {
    indice -= 40
    disclaimersReglas.push(
      `El panel tiene solo ${tamanoMuestra} persona${tamanoMuestra === 1 ? '' : 's'} — una muestra tan pequeña tiene baja representatividad.`
    )
  } else if (tamanoMuestra < 10) {
    indice -= 15
    disclaimersReglas.push(`Con ${tamanoMuestra} personas, esta muestra es moderada — interpreta los resultados con cautela.`)
  }

  if (tamanoMuestra >= 2) {
    if (desviacionScores < 0.5) {
      indice -= 30
      disclaimersReglas.push('Las opiniones son casi idénticas entre personas — posible efecto de eco o poca diversidad de disposición base.')
    } else if (desviacionScores < 1.0) {
      indice -= 15
      disclaimersReglas.push('Hay poca varianza entre los puntajes del panel — considera diversificar la disposición base antes de confiar en este resultado.')
    }
  }

  const coberturaRatio = segmentosCubiertos / TOTAL_SEGMENTOS
  const penalizacionCobertura = Math.round((1 - coberturaRatio) * 30)
  indice -= penalizacionCobertura
  if (coberturaRatio < 0.7) {
    disclaimersReglas.push(
      `Este panel cubre ${segmentosCubiertos} de ${TOTAL_SEGMENTOS} segmentos demográficos (edad × nivel de ingreso) — interpreta los resultados agregados con cautela fuera de los segmentos representados.`
    )
  }

  indice = Math.max(0, Math.min(100, Math.round(indice)))

  return { indice, tamanoMuestra, desviacionScores, segmentosCubiertos, segmentosTotales: TOTAL_SEGMENTOS, disclaimersReglas }
}

/** Runs the rule-based score plus one LLM call for qualitative disclaimers, and persists both on the test. */
export async function evaluarYGuardarConfianza(
  testId: string,
  call: ProviderCall,
  respuestas: RespuestaConPersona[]
): Promise<{ indice: number; disclaimers: string[] }> {
  const breakdown = calcularIndiceConfianzaDeRespuestas(respuestas)
  let disclaimersCualitativos: string[] = []
  try {
    disclaimersCualitativos = await getConfidenceDisclaimersQualitative(call, respuestas)
  } catch {
    // Qualitative disclaimers are a nice-to-have — never fail the whole test run if this call errors.
  }
  const disclaimers = [...breakdown.disclaimersReglas, ...disclaimersCualitativos]
  setConfianza(testId, breakdown.indice, disclaimers, {
    tamanoMuestra: breakdown.tamanoMuestra,
    desviacionScores: breakdown.desviacionScores,
    segmentosCubiertos: breakdown.segmentosCubiertos,
    segmentosTotales: breakdown.segmentosTotales
  })
  return { indice: breakdown.indice, disclaimers }
}
