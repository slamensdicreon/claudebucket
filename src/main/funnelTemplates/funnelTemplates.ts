import { z } from 'zod'
import fs from 'node:fs'
import path from 'node:path'
import type { FunnelTemplate } from '@shared/types'
import { resolveBundledResourceDir } from '../resourcesPath'

const funnelTemplateSchema = z.object({
  formatVersion: z.literal(1),
  nombre: z.string().min(1),
  descripcion: z.string(),
  etapas: z
    .array(
      z.object({
        titulo: z.string().min(1),
        estimuloContenido: z.string()
      })
    )
    .min(1)
})

export function parseFunnelTemplate(jsonText: string): FunnelTemplate {
  const parsed: unknown = JSON.parse(jsonText)
  return funnelTemplateSchema.parse(parsed) as FunnelTemplate
}

/** Curated funnel/test recipes bundled with the app (`resources/funnel-templates/*.json`) — starting points for common flows like login, checkout, or signup, meant to be edited before running. */
export function listFunnelTemplates(): FunnelTemplate[] {
  const dir = resolveBundledResourceDir('funnel-templates')
  if (!fs.existsSync(dir)) return []

  const results: FunnelTemplate[] = []
  for (const fileName of fs.readdirSync(dir)) {
    if (!fileName.endsWith('.json')) continue
    try {
      const content = fs.readFileSync(path.join(dir, fileName), 'utf-8')
      results.push(parseFunnelTemplate(content))
    } catch {
      console.warn(`[funnelTemplates] skipping invalid template file: ${fileName}`)
    }
  }
  return results.sort((a, b) => a.nombre.localeCompare(b.nombre))
}
