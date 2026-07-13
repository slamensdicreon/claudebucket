import { ipcMain } from 'electron'
import { IPC } from '@shared/ipcChannels'
import type { EstimuloAttachment, EstimuloTipo, ProviderId } from '@shared/types'
import * as testsRepo from '../db/repo/tests'
import * as personasRepo from '../db/repo/personas'
import { getLatestPersonaVersionId } from '../db/repo/personaVersions'
import { getPersonaResponseToStimulus, generarResumenEjecutivo } from '../llm/useCases'
import { resolveCall, resolveCallForPersona } from '../llm/resolveCall'
import { runWithConcurrencyLimit } from '../llm/limiter'
import { evaluarYGuardarConfianza } from '../analytics/confidence'
import { extraerYGuardarTemas } from '../analytics/temas'

const CONCURRENCY = 5

export function registerTestHandlers(): void {
  ipcMain.handle(IPC.testsList, (_e, panelId: string) => testsRepo.listTests(panelId))
  ipcMain.handle(IPC.testsGet, (_e, id: string) => testsRepo.getTest(id))
  ipcMain.handle(IPC.testsGetResults, (_e, testId: string) => testsRepo.getTestResults(testId))

  ipcMain.handle(
    IPC.testsRunSimple,
    async (
      _e,
      input: {
        workspaceId: string
        panelId: string
        nombre: string
        estimuloTipo?: EstimuloTipo
        estimuloContenido: string
        imagenDataUri?: string
        attachments?: EstimuloAttachment[]
        provider: ProviderId
        model?: string
        responseLanguage?: 'es' | 'en'
        personaIds?: string[]
        scorecardCriteria?: string[]
      }
    ) => {
      const attachments = input.attachments ?? []
      const test = testsRepo.createTest({
        workspaceId: input.workspaceId,
        panelId: input.panelId,
        nombre: input.nombre,
        estimuloTipo: input.estimuloTipo ?? 'texto',
        estimuloContenido: input.estimuloContenido,
        estimuloMetadata: {
          ...(input.imagenDataUri ? { imagenDataUri: input.imagenDataUri } : {}),
          ...(attachments.length > 0 ? { attachments } : {})
        },
        scorecardCriteria: input.scorecardCriteria ?? []
      })

      const personas = input.personaIds?.length
        ? personasRepo.listPersonasByIds(input.personaIds)
        : personasRepo.listPersonas(input.panelId)

      await runWithConcurrencyLimit(personas, CONCURRENCY, async (persona) => {
        const call = resolveCallForPersona(persona, input.workspaceId, input.provider, input.model)
        try {
          const respuesta = await getPersonaResponseToStimulus(
            call,
            persona,
            input.estimuloContenido,
            input.imagenDataUri,
            input.scorecardCriteria ?? [],
            attachments,
            input.responseLanguage ?? 'es'
          )
          testsRepo.saveRespuesta({
            testId: test.id,
            personaId: persona.id,
            personaVersionId: getLatestPersonaVersionId(persona.id),
            scoreSatisfaccion: respuesta.scoreSatisfaccion,
            scorecardScores: respuesta.scorecardScores,
            opinionTexto: respuesta.opinionTexto,
            objeciones: respuesta.objeciones,
            aspectosPositivos: respuesta.aspectosPositivos,
            modeloUsadoProvider: call.provider,
            modeloUsadoModel: call.model
          })
        } catch (err) {
          testsRepo.saveRespuesta({
            testId: test.id,
            personaId: persona.id,
            scoreSatisfaccion: 1,
            scorecardScores: {},
            opinionTexto: `⚠️ No se pudo obtener respuesta: ${err instanceof Error ? err.message : String(err)}`,
            objeciones: [],
            aspectosPositivos: [],
            modeloUsadoProvider: call.provider,
            modeloUsadoModel: call.model
          })
        }
      })

      const results = testsRepo.getTestResults(test.id)
      if (results && results.respuestas.length > 0) {
        const analysisCall = resolveCall(input.workspaceId, input.provider, input.model)
        await Promise.all([
          evaluarYGuardarConfianza(test.id, analysisCall, results.respuestas),
          extraerYGuardarTemas(test.id, analysisCall, results.respuestas),
          generarResumenEjecutivo(analysisCall, input.estimuloContenido, results.respuestas)
            .then((resumen) => resumen && testsRepo.setResumenEjecutivo(test.id, resumen))
            .catch(() => {})
        ])
      }

      return testsRepo.getTestResults(test.id)
    }
  )
}
