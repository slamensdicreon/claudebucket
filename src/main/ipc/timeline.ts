import { ipcMain } from 'electron'
import { IPC } from '@shared/ipcChannels'
import * as timelineRepo from '../db/repo/timeline'

export function registerTimelineHandlers(): void {
  ipcMain.handle(IPC.timelineGetForPanel, (_e, panelId: string) => timelineRepo.getPanelTimeline(panelId))
}
