import { ipcMain } from 'electron'
import { IPC } from '@shared/ipcChannels'
import type { ProviderId } from '@shared/types'
import * as followUpsRepo from '../db/repo/followUps'
import * as testsRepo from '../db/repo/tests'
import * as personasRepo from '../db/repo/personas'
import { getFollowUpReply } from '../llm/useCases'
import { resolveCallForPersona } from '../llm/resolveCall'
import { runWithConcurrencyLimit } from '../llm/limiter'

const CONCURRENCY = 5

export function registerFollowUpHandlers(): void {
  ipcMain.handle(IPC.followUpsListForTest, (_e, testId: string) => followUpsRepo.listFollowUpsForTest(testId))
  ipcMain.handle(IPC.followUpsGetResults, (_e, followUpId: string) => followUpsRepo.getFollowUpResults(followUpId))

  ipcMain.handle(
    IPC.followUpsRun,
    async (
      _e,
      input: {
        testId: string
        workspaceId: string
        personaIds: string[]
        pregunta: string
        provider: ProviderId
        model?: string
        responseLanguage?: 'es' | 'en'
      }
    ) => {
      const originalRespuestas = testsRepo.listRespuestasForTest(input.testId)
      const originalByPersona = new Map(originalRespuestas.map((r) => [r.personaId, r.opinionTexto]))

      const followUp = followUpsRepo.createFollowUp(input.testId, input.pregunta, input.personaIds)
      const personas = personasRepo.listPersonasByIds(input.personaIds)

      await runWithConcurrencyLimit(personas, CONCURRENCY, async (persona) => {
        const call = resolveCallForPersona(persona, input.workspaceId, input.provider, input.model)
        const opinionOriginal = originalByPersona.get(persona.id) ?? '(sin opinión previa registrada)'
        try {
          const respuesta = await getFollowUpReply(call, persona, opinionOriginal, input.pregunta, input.responseLanguage ?? 'es')
          followUpsRepo.saveFollowUpRespuesta(followUp.id, persona.id, respuesta)
        } catch (err) {
          followUpsRepo.saveFollowUpRespuesta(
            followUp.id,
            persona.id,
            `⚠️ No se pudo obtener respuesta: ${err instanceof Error ? err.message : String(err)}`
          )
        }
      })

      return followUpsRepo.getFollowUpResults(followUp.id)
    }
  )
}
