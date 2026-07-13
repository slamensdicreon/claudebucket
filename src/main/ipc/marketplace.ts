import { ipcMain, BrowserWindow, dialog } from 'electron'
import fs from 'node:fs'
import { IPC } from '@shared/ipcChannels'
import { buildMarketplaceTemplate, parseMarketplaceTemplate, listBundledTemplates, fetchRemoteTemplates } from '../marketplace/marketplace'
import { updatePanel } from '../db/repo/panels'

function safeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').slice(0, 80) || 'panel'
}

export function registerMarketplaceHandlers(): void {
  ipcMain.handle(
    IPC.marketplaceExportPanel,
    async (event, input: { panelId: string; descripcionPublica: string; autorPublico: string }) => {
      const template = buildMarketplaceTemplate(input.panelId, input.descripcionPublica, input.autorPublico)
      if (!template) return { success: false as const }

      const parentWindow = BrowserWindow.fromWebContents(event.sender) ?? undefined
      const { canceled, filePath } = await dialog.showSaveDialog(parentWindow as BrowserWindow, {
        title: 'Exportar panel como plantilla pública',
        defaultPath: `${safeFileName(template.nombre)}.crowdmind-panel.json`,
        filters: [{ name: 'Crowdmind Panel Template', extensions: ['json'] }]
      })
      if (canceled || !filePath) return { success: false as const }

      fs.writeFileSync(filePath, JSON.stringify(template, null, 2))
      updatePanel(input.panelId, {
        esPublico: true,
        descripcionPublica: input.descripcionPublica,
        autorPublico: input.autorPublico
      })
      return { success: true as const, filePath }
    }
  )

  ipcMain.handle(IPC.marketplaceImportPanel, async (event) => {
    const parentWindow = BrowserWindow.fromWebContents(event.sender) ?? undefined
    const { canceled, filePaths } = await dialog.showOpenDialog(parentWindow as BrowserWindow, {
      title: 'Importar plantilla de panel',
      filters: [{ name: 'Crowdmind Panel Template', extensions: ['json'] }],
      properties: ['openFile']
    })
    if (canceled || filePaths.length === 0) return null

    try {
      const content = fs.readFileSync(filePaths[0], 'utf-8')
      return parseMarketplaceTemplate(content)
    } catch {
      return null
    }
  })

  ipcMain.handle(IPC.marketplaceListBundled, () => listBundledTemplates())
  ipcMain.handle(IPC.marketplaceRefreshFromRepo, () => fetchRemoteTemplates())
}
