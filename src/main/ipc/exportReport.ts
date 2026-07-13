import { ipcMain, BrowserWindow, dialog } from 'electron'
import fs from 'node:fs'
import { IPC } from '@shared/ipcChannels'
import { generarReporteCompletoHtml, generarReporteNarrativoHtml, generarReporteNarrativoMarkdown } from '../report/narrativeReport'
import { getTest, getTestResults } from '../db/repo/tests'
import { listTemas } from '../db/repo/temas'

function safeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').slice(0, 80) || 'reporte'
}

export function registerExportHandlers(): void {
  ipcMain.handle(IPC.testsGetNarrativeReport, (_e, testId: string) => generarReporteNarrativoHtml(testId))

  ipcMain.handle(IPC.testsExportPdf, async (event, testId: string, variant: 'summary' | 'full' = 'summary') => {
    const html = variant === 'full' ? generarReporteCompletoHtml(testId) : generarReporteNarrativoHtml(testId)
    const test = getTest(testId)
    if (!html || !test) return { success: false as const }

    const parentWindow = BrowserWindow.fromWebContents(event.sender) ?? undefined
    const { canceled, filePath } = await dialog.showSaveDialog(parentWindow as BrowserWindow, {
      title: 'Exportar reporte como PDF',
      defaultPath: `${safeFileName(test.nombre)}-${variant === 'full' ? 'informe-completo' : 'resumen'}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    })
    if (canceled || !filePath) return { success: false as const }

    const pdfWindow = new BrowserWindow({ show: false, webPreferences: { offscreen: true } })
    try {
      await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
      const pdfBuffer = await pdfWindow.webContents.printToPDF({})
      fs.writeFileSync(filePath, pdfBuffer)
      return { success: true as const, filePath }
    } finally {
      pdfWindow.destroy()
    }
  })

  ipcMain.handle(IPC.testsExportJson, async (event, testId: string) => {
    const results = getTestResults(testId)
    const test = getTest(testId)
    if (!results || !test) return { success: false as const }
    const temas = listTemas(testId)

    const parentWindow = BrowserWindow.fromWebContents(event.sender) ?? undefined
    const { canceled, filePath } = await dialog.showSaveDialog(parentWindow as BrowserWindow, {
      title: 'Exportar resultados como JSON',
      defaultPath: `${safeFileName(test.nombre)}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (canceled || !filePath) return { success: false as const }

    fs.writeFileSync(filePath, JSON.stringify({ ...results, temas }, null, 2))
    return { success: true as const, filePath }
  })

  ipcMain.handle(IPC.testsExportMarkdown, async (event, testId: string) => {
    const markdown = generarReporteNarrativoMarkdown(testId)
    const test = getTest(testId)
    if (!markdown || !test) return { success: false as const }

    const parentWindow = BrowserWindow.fromWebContents(event.sender) ?? undefined
    const { canceled, filePath } = await dialog.showSaveDialog(parentWindow as BrowserWindow, {
      title: 'Exportar reporte como Markdown',
      defaultPath: `${safeFileName(test.nombre)}.md`,
      filters: [{ name: 'Markdown', extensions: ['md'] }]
    })
    if (canceled || !filePath) return { success: false as const }

    fs.writeFileSync(filePath, markdown)
    return { success: true as const, filePath }
  })
}
