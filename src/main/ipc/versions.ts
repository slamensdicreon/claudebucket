import { ipcMain } from 'electron'
import { IPC } from '@shared/ipcChannels'
import * as versionsRepo from '../db/repo/personaVersions'

export function registerVersionHandlers(): void {
  ipcMain.handle(IPC.versionsList, (_e, personaId: string) => versionsRepo.listPersonaVersions(personaId))
  ipcMain.handle(IPC.versionsTestsUsing, (_e, versionId: string) => versionsRepo.listTestNamesUsingVersion(versionId))
}
