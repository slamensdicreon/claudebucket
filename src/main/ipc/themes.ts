import { ipcMain } from 'electron'
import { IPC } from '@shared/ipcChannels'
import type { ProviderId } from '@shared/types'
import * as temasRepo from '../db/repo/temas'
import * as testsRepo from '../db/repo/tests'
import { resolveCall } from '../llm/resolveCall'
import { extraerYGuardarTemas } from '../analytics/temas'

export function registerThemeHandlers(): void {
  ipcMain.handle(IPC.temasList, (_e, testId: string) => temasRepo.listTemas(testId))
  ipcMain.handle(
    IPC.temasExtraer,
    async (_e, input: { testId: string; workspaceId: string; provider: ProviderId; model?: string }) => {
      const results = testsRepo.getTestResults(input.testId)
      if (!results || results.respuestas.length === 0) return []
      const call = resolveCall(input.workspaceId, input.provider, input.model)
      return extraerYGuardarTemas(input.testId, call, results.respuestas)
    }
  )
}
