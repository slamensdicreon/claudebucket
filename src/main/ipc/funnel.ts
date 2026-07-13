import { ipcMain } from 'electron'
import { IPC } from '@shared/ipcChannels'
import type { EtapaFunnelDraft, ModoInteraccion, ProviderId } from '@shared/types'
import * as testsRepo from '../db/repo/tests'
import * as funnelRepo from '../db/repo/funnel'
import * as personasRepo from '../db/repo/personas'
import { resolveCallForPersona } from '../llm/resolveCall'
import { runFunnelTest } from '../engine/funnelEngine'
import { listFunnelTemplates } from '../funnelTemplates/funnelTemplates'

export function registerFunnelHandlers(): void {
  ipcMain.handle(IPC.funnelGetResults, (_e, testId: string) => funnelRepo.getFunnelResults(testId))
  ipcMain.handle(IPC.funnelTemplatesList, () => listFunnelTemplates())

  ipcMain.handle(
    IPC.funnelRun,
    async (
      _e,
      input: {
        workspaceId: string
        panelId: string
        nombre: string
        modoInteraccion: ModoInteraccion
        etapas: EtapaFunnelDraft[]
        provider: ProviderId
        model?: string
        responseLanguage?: 'es' | 'en'
        personaIds?: string[]
        scorecardCriteria?: string[]
      }
    ) => {
      const test = testsRepo.createTest({
        workspaceId: input.workspaceId,
        panelId: input.panelId,
        nombre: input.nombre,
        tipo: 'funnel',
        modoInteraccion: input.modoInteraccion,
        estimuloTipo: 'texto',
        estimuloContenido: input.etapas[0]?.estimuloContenido ?? '',
        scorecardCriteria: input.scorecardCriteria ?? []
      })

      const etapas = funnelRepo.createEtapas(test.id, input.etapas)

      const personas = input.personaIds?.length
        ? personasRepo.listPersonasByIds(input.personaIds)
        : personasRepo.listPersonas(input.panelId)

      await runFunnelTest({
        testId: test.id,
        personas,
        etapas,
        modoInteraccion: input.modoInteraccion,
        scorecardCriteria: input.scorecardCriteria ?? [],
        responseLanguage: input.responseLanguage ?? 'es',
        resolveCallForPersona: (persona) => resolveCallForPersona(persona, input.workspaceId, input.provider, input.model)
      })

      return funnelRepo.getFunnelResults(test.id)
    }
  )
}
