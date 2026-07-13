import { ipcMain } from 'electron'
import { IPC } from '@shared/ipcChannels'
import type { ComparacionModo } from '@shared/types'
import * as comparisonRepo from '../db/repo/comparison'

export function registerComparisonHandlers(): void {
  ipcMain.handle(IPC.comparisonListTests, (_e, workspaceId: string) => comparisonRepo.listTestsForWorkspace(workspaceId))
  ipcMain.handle(IPC.comparisonList, (_e, workspaceId: string) => comparisonRepo.listComparaciones(workspaceId))
  ipcMain.handle(
    IPC.comparisonRun,
    (_e, input: { workspaceId: string; modo: ComparacionModo; testAId: string; testBId: string }) => {
      const comparacion = comparisonRepo.createComparacion(input.workspaceId, input.modo, input.testAId, input.testBId)
      return comparisonRepo.computeComparison(comparacion)
    }
  )
}
