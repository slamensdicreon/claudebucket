import { app, shell, BrowserWindow } from 'electron'
import path from 'node:path'
import { is } from './electronEnv'
import { getDb } from './db/client'
import { registerIpcHandlers } from './ipc/register'
import { initAutoUpdater, checkForUpdates, isAutoUpdateSupported } from './update/autoUpdate'

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#0b0c0e',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  win.on('ready-to-show', () => win.show())

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  return win
}

app.whenReady().then(() => {
  getDb() // fail fast if the local SQLite file can't be opened/migrated
  registerIpcHandlers()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  const win = createWindow()
  initAutoUpdater(win)
  if (isAutoUpdateSupported()) {
    win.once('ready-to-show', () => {
      setTimeout(() => checkForUpdates(), 3000)
    })
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
