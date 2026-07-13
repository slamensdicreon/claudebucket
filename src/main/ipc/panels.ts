import { ipcMain } from 'electron'
import { IPC } from '@shared/ipcChannels'
import * as panelsRepo from '../db/repo/panels'

export function registerPanelHandlers(): void {
  ipcMain.handle(IPC.panelsList, (_e, workspaceId: string) => panelsRepo.listPanels(workspaceId))
  ipcMain.handle(IPC.panelsGet, (_e, id: string) => panelsRepo.getPanel(id))
  ipcMain.handle(
    IPC.panelsCreate,
    (_e, input: { workspaceId: string; nombre: string; descripcion: string; color: string }) => panelsRepo.createPanel(input)
  )
  ipcMain.handle(
    IPC.panelsUpdate,
    (
      _e,
      id: string,
      patch: Partial<{
        nombre: string
        descripcion: string
        color: string
        esPublico: boolean
        descripcionPublica: string
        autorPublico: string
      }>
    ) => panelsRepo.updatePanel(id, patch)
  )
  ipcMain.handle(IPC.panelsDelete, (_e, id: string) => panelsRepo.deletePanel(id))
}
