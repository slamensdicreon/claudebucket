import { app, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import { IPC } from '@shared/ipcChannels'
import type { UpdateStatus } from '@shared/types'

let currentWindow: BrowserWindow | null = null
let currentStatus: UpdateStatus = { state: 'idle' }
let availableInfo: { version: string; releaseName?: string; releaseNotes?: string; releaseDate?: string } | null = null

function send(status: UpdateStatus): void {
  currentStatus = status
  currentWindow?.webContents.send(IPC.updateStatusPush, status)
}

function notesToMarkdown(notes: unknown): string | undefined {
  if (typeof notes === 'string') return notes
  if (Array.isArray(notes)) {
    return notes
      .map((n: any) => {
        if (typeof n === 'string') return n
        const version = n?.version ? `## ${n.version}\n` : ''
        const note = typeof n?.note === 'string' ? n.note : ''
        return `${version}${note}`.trim()
      })
      .filter(Boolean)
      .join('\n\n')
  }
  return undefined
}

function updateInfoPayload(info: any) {
  return {
    version: String(info.version ?? ''),
    releaseName: typeof info.releaseName === 'string' ? info.releaseName : undefined,
    releaseNotes: notesToMarkdown(info.releaseNotes),
    releaseDate: typeof info.releaseDate === 'string' ? info.releaseDate : undefined
  }
}

export function initAutoUpdater(win: BrowserWindow): void {
  currentWindow = win
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false

  autoUpdater.on('checking-for-update', () => send({ state: 'checking' }))
  autoUpdater.on('update-available', (info) => {
    availableInfo = updateInfoPayload(info)
    send({ state: 'available', ...availableInfo })
  })
  autoUpdater.on('update-not-available', () => send({ state: 'not-available', checkedAt: Date.now() }))
  autoUpdater.on('error', (err) => send({ state: 'error', message: err.message }))
  autoUpdater.on('download-progress', (progress) =>
    send({
      state: 'downloading',
      version: availableInfo?.version,
      percent: Math.max(0, Math.min(100, Math.round(progress.percent))),
      transferred: progress.transferred,
      total: progress.total,
      bytesPerSecond: progress.bytesPerSecond
    })
  )
  autoUpdater.on('update-downloaded', (info) => {
    const payload = updateInfoPayload(info)
    availableInfo = { ...availableInfo, ...payload }
    send({ state: 'downloaded', ...availableInfo })
  })
}

export function getUpdateStatus(): UpdateStatus {
  return currentStatus
}

/** Auto-update only makes sense for a packaged, installed build — dev mode has nothing to update. */
export function isAutoUpdateSupported(): boolean {
  return app.isPackaged
}

export async function checkForUpdates(): Promise<void> {
  if (!isAutoUpdateSupported()) {
    send({ state: 'not-available' })
    return
  }
  try {
    await autoUpdater.checkForUpdates()
  } catch (err) {
    send({ state: 'error', message: err instanceof Error ? err.message : String(err) })
  }
}

export async function downloadUpdate(): Promise<void> {
  if (!isAutoUpdateSupported()) return
  try {
    await autoUpdater.downloadUpdate()
  } catch (err) {
    send({ state: 'error', message: err instanceof Error ? err.message : String(err) })
  }
}

export function quitAndInstall(): void {
  if (!isAutoUpdateSupported()) return
  autoUpdater.quitAndInstall()
}
