import { createWorkspace } from '../db/repo/workspaces'
import { createPanel } from '../db/repo/panels'
import { createPersonasBulk } from '../db/repo/personas'
import { createTest, saveRespuesta, getTestResults, setResumenEjecutivo } from '../db/repo/tests'
import { getLatestPersonaVersionId } from '../db/repo/personaVersions'
import { generatePersonasWithAi, getPersonaResponseToStimulus, generarResumenEjecutivo } from '../llm/useCases'
import { evaluarYGuardarConfianza } from '../analytics/confidence'
import { extraerYGuardarTemas } from '../analytics/temas'
import { runWithConcurrencyLimit } from '../llm/limiter'
import type { Workspace } from '@shared/types'

const DEMO_CALL = { provider: 'local' as const, apiKey: null, model: 'local-deterministic-v1' }

const DEMO_BRIEF =
  'Consumidores urbanos de 25 a 40 años en LatAm, ingreso medio, interesados en alimentación saludable y conveniencia, activos en redes sociales.'

const DEMO_ESTIMULO =
  'Nueva línea de comidas congeladas listas en 5 minutos. Ingredientes 100% naturales, certificación orgánica, entrega el mismo día en las principales ciudades. Precio: 15% más que la competencia tradicional.'

/**
 * Creates a fully populated demo workspace (panel + AI personas + a completed test with confidence
 * index/themes/executive summary) using only the offline Local provider — free, deterministic, and
 * instant, so first-time users see a working example instead of an empty app.
 */
export async function seedDemoWorkspace(): Promise<Workspace> {
  const workspace = createWorkspace('Demo — Damory Foods LatAm')
  const panel = createPanel({
    workspaceId: workspace.id,
    nombre: 'Consumidores LatAm 25–40',
    descripcion: 'Panel de ejemplo generado automáticamente para explorar Crowdmind sin necesidad de API keys.',
    color: 'var(--color-primary)'
  })

  const drafts = await generatePersonasWithAi(DEMO_CALL, DEMO_BRIEF, 8)
  const personas = createPersonasBulk(panel.id, drafts)

  const test = createTest({
    workspaceId: workspace.id,
    panelId: panel.id,
    nombre: 'Lanzamiento Q3 (ejemplo)',
    estimuloTipo: 'texto',
    estimuloContenido: DEMO_ESTIMULO
  })

  await runWithConcurrencyLimit(personas, 5, async (persona) => {
    const respuesta = await getPersonaResponseToStimulus(DEMO_CALL, persona, DEMO_ESTIMULO)
    saveRespuesta({
      testId: test.id,
      personaId: persona.id,
      personaVersionId: getLatestPersonaVersionId(persona.id),
      scoreSatisfaccion: respuesta.scoreSatisfaccion,
      opinionTexto: respuesta.opinionTexto,
      objeciones: respuesta.objeciones,
      aspectosPositivos: respuesta.aspectosPositivos,
      modeloUsadoProvider: 'local',
      modeloUsadoModel: 'local-deterministic-v1'
    })
  })

  const results = getTestResults(test.id)
  if (results && results.respuestas.length > 0) {
    await Promise.all([
      evaluarYGuardarConfianza(test.id, DEMO_CALL, results.respuestas),
      extraerYGuardarTemas(test.id, DEMO_CALL, results.respuestas),
      generarResumenEjecutivo(DEMO_CALL, DEMO_ESTIMULO, results.respuestas).then((resumen) => resumen && setResumenEjecutivo(test.id, resumen))
    ])
  }

  return workspace
}
