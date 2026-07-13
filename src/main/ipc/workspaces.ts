import { ipcMain } from 'electron'
import { IPC } from '@shared/ipcChannels'
import * as workspacesRepo from '../db/repo/workspaces'
import { seedDemoWorkspace } from '../demo/seedDemo'

export function registerWorkspaceHandlers(): void {
  ipcMain.handle(IPC.workspacesList, () => workspacesRepo.listWorkspaces())
  ipcMain.handle(IPC.workspacesCreate, (_e, nombre: string) => workspacesRepo.createWorkspace(nombre))
  ipcMain.handle(IPC.workspacesRename, (_e, id: string, nombre: string) => workspacesRepo.renameWorkspace(id, nombre))
  ipcMain.handle(IPC.workspacesDelete, (_e, id: string) => workspacesRepo.deleteWorkspace(id))
  ipcMain.handle(IPC.workspacesSeedDemo, () => seedDemoWorkspace())
}
