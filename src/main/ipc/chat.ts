import { ipcMain } from 'electron'
import { IPC } from '@shared/ipcChannels'
import type { ProviderId } from '@shared/types'
import * as chatRepo from '../db/repo/chat'
import * as personasRepo from '../db/repo/personas'
import { getPersonaChatReply } from '../llm/useCases'
import { resolveCallForPersona } from '../llm/resolveCall'

export function registerChatHandlers(): void {
  ipcMain.handle(IPC.chatList, (_e, personaId: string) => chatRepo.listChatMensajes(personaId))
  ipcMain.handle(
    IPC.chatSend,
    async (
      _e,
      input: { personaId: string; workspaceId: string; mensaje: string; provider: ProviderId; model?: string; responseLanguage?: 'es' | 'en' }
    ) => {
      const persona = personasRepo.getPersona(input.personaId)
      if (!persona) throw new Error('Persona no encontrada')
      const historia = chatRepo.listChatMensajes(input.personaId)
      const userMsg = chatRepo.saveChatMensaje(input.personaId, 'user', input.mensaje)
      const call = resolveCallForPersona(persona, input.workspaceId, input.provider, input.model)
      const respuestaTexto = await getPersonaChatReply(call, persona, historia, input.mensaje, input.responseLanguage ?? 'es')
      const personaMsg = chatRepo.saveChatMensaje(input.personaId, 'persona', respuestaTexto)
      return { userMsg, personaMsg }
    }
  )
}
