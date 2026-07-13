import { ipcMain } from 'electron'
import { IPC } from '@shared/ipcChannels'
import type { ProviderId } from '@shared/types'
import * as settingsRepo from '../db/repo/providerSettings'

export function registerSettingsHandlers(): void {
  ipcMain.handle(IPC.settingsListProviders, () => settingsRepo.listGlobalProviderSettings())
  ipcMain.handle(IPC.settingsSetApiKey, (_e, input: { provider: ProviderId; workspaceId: string | null; apiKey: string }) =>
    settingsRepo.setApiKey(input.provider, input.workspaceId, input.apiKey)
  )
  ipcMain.handle(IPC.settingsClearApiKey, (_e, input: { provider: ProviderId; workspaceId: string | null }) =>
    settingsRepo.clearApiKey(input.provider, input.workspaceId)
  )
  ipcMain.handle(IPC.settingsSetDefaultModel, (_e, input: { provider: ProviderId; workspaceId: string | null; model: string }) =>
    settingsRepo.setDefaultModel(input.provider, input.workspaceId, input.model)
  )
  ipcMain.handle(IPC.settingsTestProvider, async (_e, input: { provider: ProviderId; workspaceId: string | null }) => {
    if (input.provider === 'local') return { ok: true, message: 'Proveedor local disponible.' }
    const { apiKey } = settingsRepo.resolveProviderCredentials(input.provider, input.workspaceId)
    if (!apiKey) return { ok: false, message: 'Falta la API key.' }
    if (input.provider !== 'openai') return { ok: true, message: 'API key guardada. La validacion en vivo se hara al usar el proveedor.' }
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` }
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return { ok: false, message: `OpenAI respondio ${res.status}: ${body.slice(0, 180)}` }
    }
    return { ok: true, message: 'OpenAI autorizado correctamente.' }
  })
  ipcMain.handle(IPC.settingsIsEncryptionAvailable, () => settingsRepo.isEncryptionAvailable())
}
