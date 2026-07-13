import { ipcMain, BrowserWindow, dialog } from 'electron'
import { IPC } from '@shared/ipcChannels'
import type { CsvColumnMapping, CsvPreview, InterviewPersonaResult, PersonaDraft, PersonaGenerationInput, PersonaImproveInput, ProviderId } from '@shared/types'
import * as personasRepo from '../db/repo/personas'
import { generatePersonasWithAi, getPersonaChatReply, improvePersonaDraftWithAi } from '../llm/useCases'
import { resolveCall, resolveCallForPersona } from '../llm/resolveCall'
import { readCsvPreview, parseCsvToPersonaDrafts } from '../csv/csvImport'
import { generatePersonaAvatarImage } from '../avatarImage/generateAvatarImage'
import { resolveProviderCredentials } from '../db/repo/providerSettings'

export function registerPersonaHandlers(): void {
  ipcMain.handle(IPC.personasList, (_e, panelId: string) => personasRepo.listPersonas(panelId))
  ipcMain.handle(IPC.personasGet, (_e, id: string) => personasRepo.getPersona(id))
  ipcMain.handle(IPC.personasCreate, (_e, panelId: string, draft: PersonaDraft) => personasRepo.createPersona(panelId, draft))
  ipcMain.handle(IPC.personasUpdate, (_e, id: string, draft: Partial<PersonaDraft>) => personasRepo.updatePersona(id, draft))
  ipcMain.handle(IPC.personasDelete, (_e, id: string) => personasRepo.deletePersona(id))

  ipcMain.handle(
    IPC.personasGeneratePreview,
    async (_e, input: PersonaGenerationInput | { workspaceId: string; brief: string; count: number; provider: ProviderId; model?: string }) => {
      const call = resolveCall(input.workspaceId, input.provider, input.model)
      if ('panelId' in input) {
        const existing = personasRepo.listPersonas(input.panelId)
        return generatePersonasWithAi(call, input, undefined, existing)
      }
      return generatePersonasWithAi(call, input.brief, input.count)
    }
  )
  ipcMain.handle(IPC.personasImproveDraft, async (_e, input: PersonaImproveInput) => {
    const call = resolveCall(input.workspaceId, input.provider, input.model)
    return improvePersonaDraftWithAi(call, input.draft, input.instructions)
  })
  ipcMain.handle(
    IPC.personasRunInterview,
    async (
      _e,
      input: { workspaceId: string; panelId: string; guide: string; count: number; provider: ProviderId; model?: string }
    ): Promise<InterviewPersonaResult[]> => {
      const personas = personasRepo.listPersonas(input.panelId).slice(0, Math.max(1, Math.min(20, input.count || 5)))
      return Promise.all(
        personas.map(async (persona) => {
          const call = resolveCallForPersona(persona, input.workspaceId, input.provider, input.model)
          const respuesta = await getPersonaChatReply(
            call,
            persona,
            [],
            `Responde esta entrevista de investigacion como una respuesta integrada, concreta y accionable:\n${input.guide}`
          )
          return { personaId: persona.id, personaNombre: persona.nombre, respuesta }
        })
      )
    }
  )
  ipcMain.handle(IPC.personasSaveBulk, (_e, panelId: string, drafts: PersonaDraft[]) =>
    personasRepo.createPersonasBulk(panelId, drafts)
  )

  ipcMain.handle(IPC.personasPickCsvFile, async (event): Promise<CsvPreview | null> => {
    const parentWindow = BrowserWindow.fromWebContents(event.sender) ?? undefined
    const { canceled, filePaths } = await dialog.showOpenDialog(parentWindow as BrowserWindow, {
      title: 'Selecciona un CSV de encuesta',
      filters: [{ name: 'CSV', extensions: ['csv'] }],
      properties: ['openFile']
    })
    if (canceled || filePaths.length === 0) return null
    return readCsvPreview(filePaths[0])
  })

  ipcMain.handle(
    IPC.personasImportCsvPreview,
    (_e, input: { filePath: string; mapeoColumnas: CsvColumnMapping; agruparSimilares: boolean }) =>
      parseCsvToPersonaDrafts(input.filePath, input.mapeoColumnas, input.agruparSimilares)
  )

  ipcMain.handle(IPC.personasGenerateAvatarImage, async (_e, input: { personaId: string; workspaceId: string }) => {
    const persona = personasRepo.getPersona(input.personaId)
    if (!persona) throw new Error('Persona no encontrada')
    const { apiKey } = resolveProviderCredentials('openai', input.workspaceId)
    const dataUri = await generatePersonaAvatarImage(persona, apiKey)
    return personasRepo.updatePersona(input.personaId, { avatarImageDataUri: dataUri })
  })
}
