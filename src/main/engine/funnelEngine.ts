import type { EtapaFunnel, ModoInteraccion, Persona } from '@shared/types'
import type { ProviderCall } from '../llm/useCases'
import { getFunnelStageResponse } from '../llm/useCases'
import type { EtapaPropiaHistorial } from '../llm/promptTemplates'
import { saveRespuesta } from '../db/repo/tests'
import { getLatestPersonaVersionId } from '../db/repo/personaVersions'
import { runWithConcurrencyLimit } from '../llm/limiter'

const CONCURRENCY = 5

interface RunFunnelArgs {
  testId: string
  personas: Persona[]
  etapas: EtapaFunnel[]
  modoInteraccion: ModoInteraccion
  scorecardCriteria?: string[]
  responseLanguage?: 'es' | 'en'
  resolveCallForPersona: (persona: Persona) => ProviderCall
}

function persistStageResult(
  testId: string,
  persona: Persona,
  etapa: EtapaFunnel,
  call: ProviderCall,
  respuesta: {
    scoreSatisfaccion: number
    scorecardScores?: Record<string, number>
    opinionTexto: string
    objeciones: string[]
    aspectosPositivos: string[]
    avanzoASiguienteEtapa: boolean
  }
): void {
  saveRespuesta({
    testId,
    personaId: persona.id,
    etapaFunnelId: etapa.id,
    avanzoASiguienteEtapa: respuesta.avanzoASiguienteEtapa,
    personaVersionId: getLatestPersonaVersionId(persona.id),
    scoreSatisfaccion: respuesta.scoreSatisfaccion,
    scorecardScores: respuesta.scorecardScores ?? {},
    opinionTexto: respuesta.opinionTexto,
    objeciones: respuesta.objeciones,
    aspectosPositivos: respuesta.aspectosPositivos,
    modeloUsadoProvider: call.provider,
    modeloUsadoModel: call.model
  })
}

/** Individual mode: each persona runs the full stage sequence independently and in parallel, stopping at its own drop-off point. */
async function runFunnelIndividual(args: RunFunnelArgs): Promise<void> {
  const { testId, personas, etapas, resolveCallForPersona, scorecardCriteria = [], responseLanguage = 'es' } = args

  await runWithConcurrencyLimit(personas, CONCURRENCY, async (persona) => {
    const historialPropio: EtapaPropiaHistorial[] = []
    const call = resolveCallForPersona(persona)

    for (const etapa of etapas) {
      try {
        const respuesta = await getFunnelStageResponse(call, persona, etapa, historialPropio, undefined, scorecardCriteria, responseLanguage)
        persistStageResult(testId, persona, etapa, call, respuesta)
        historialPropio.push({ tituloEtapa: etapa.titulo, opinion: respuesta.opinionTexto, avanzo: respuesta.avanzoASiguienteEtapa })
        if (!respuesta.avanzoASiguienteEtapa) break
      } catch (err) {
        persistStageResult(testId, persona, etapa, call, {
          scoreSatisfaccion: 1,
          scorecardScores: {},
          opinionTexto: `⚠️ No se pudo obtener respuesta: ${err instanceof Error ? err.message : String(err)}`,
          objeciones: [],
          aspectosPositivos: [],
          avanzoASiguienteEtapa: false
        })
        break
      }
    }
  })
}

/**
 * Focus group mode: personas are processed one at a time within each stage (never in parallel), each
 * seeing a summary of what peers in the same stage have already said — order is rotated per stage so
 * the first respondent doesn't always anchor the rest of the group.
 */
async function runFunnelFocusGroup(args: RunFunnelArgs): Promise<void> {
  const { testId, personas, etapas, resolveCallForPersona, scorecardCriteria = [], responseLanguage = 'es' } = args
  const historialPorPersona = new Map<string, EtapaPropiaHistorial[]>(personas.map((p) => [p.id, []]))
  let activos = [...personas]

  for (let stageIndex = 0; stageIndex < etapas.length; stageIndex++) {
    const etapa = etapas[stageIndex]
    if (activos.length === 0) break

    const rotateBy = stageIndex % activos.length
    const orden = [...activos.slice(rotateBy), ...activos.slice(0, rotateBy)]

    const peerResponsesSoFar: string[] = []
    const seguirán: Persona[] = []

    for (const persona of orden) {
      const call = resolveCallForPersona(persona)
      const historialPropio = historialPorPersona.get(persona.id) ?? []
      const peerSummary = peerResponsesSoFar.length ? peerResponsesSoFar.join('\n') : undefined

      try {
        const respuesta = await getFunnelStageResponse(call, persona, etapa, historialPropio, peerSummary, scorecardCriteria, responseLanguage)
        persistStageResult(testId, persona, etapa, call, respuesta)
        historialPropio.push({ tituloEtapa: etapa.titulo, opinion: respuesta.opinionTexto, avanzo: respuesta.avanzoASiguienteEtapa })
        peerResponsesSoFar.push(`${persona.nombre} dijo: "${respuesta.opinionTexto}" (${respuesta.avanzoASiguienteEtapa ? 'avanzó' : 'abandonó'})`)
        if (respuesta.avanzoASiguienteEtapa) seguirán.push(persona)
      } catch (err) {
        persistStageResult(testId, persona, etapa, call, {
          scoreSatisfaccion: 1,
          scorecardScores: {},
          opinionTexto: `⚠️ No se pudo obtener respuesta: ${err instanceof Error ? err.message : String(err)}`,
          objeciones: [],
          aspectosPositivos: [],
          avanzoASiguienteEtapa: false
        })
      }
    }

    activos = seguirán
  }
}

export async function runFunnelTest(args: RunFunnelArgs): Promise<void> {
  if (args.modoInteraccion === 'focus_group') {
    await runFunnelFocusGroup(args)
  } else {
    await runFunnelIndividual(args)
  }
}
