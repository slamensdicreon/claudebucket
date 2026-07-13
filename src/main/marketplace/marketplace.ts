import { z } from 'zod'
import fs from 'node:fs'
import path from 'node:path'
import type { MarketplacePanelTemplate, PersonaDraft } from '@shared/types'
import { DISPOSICIONES, NIVELES_INGRESO } from '@shared/types'
import { listPersonas } from '../db/repo/personas'
import { getPanel } from '../db/repo/panels'
import { resolveBundledResourceDir } from '../resourcesPath'

const personaDraftSchema = z.object({
  nombre: z.string(),
  edad: z.number(),
  genero: z.string(),
  ciudad: z.string(),
  pais: z.string(),
  ocupacion: z.string(),
  nivelIngreso: z.enum(NIVELES_INGRESO as [string, ...string[]]),
  nivelEducativo: z.string(),
  estadoCivil: z.string(),
  disposicionBase: z.enum(DISPOSICIONES as [string, ...string[]]),
  rasgos: z.array(z.string()),
  valores: z.array(z.string()),
  historiaPersonal: z.string(),
  objecionesTipicas: z.array(z.string()),
  canalPreferido: z.string(),
  llmProviderOverride: z.null(),
  llmModelOverride: z.null()
})

const templateSchema = z.object({
  formatVersion: z.literal(1),
  nombre: z.string().min(1),
  descripcionPublica: z.string(),
  autorPublico: z.string(),
  personas: z.array(personaDraftSchema).min(1)
})

/** Strips internal IDs/workspace linkage — this is what gets written to the shareable .json file. */
export function buildMarketplaceTemplate(panelId: string, descripcionPublica: string, autorPublico: string): MarketplacePanelTemplate | null {
  const panel = getPanel(panelId)
  if (!panel) return null
  const personas = listPersonas(panelId)

  const personaDrafts: PersonaDraft[] = personas.map((p) => ({
    nombre: p.nombre,
    edad: p.edad,
    genero: p.genero,
    ciudad: p.ciudad,
    pais: p.pais,
    ocupacion: p.ocupacion,
    nivelIngreso: p.nivelIngreso,
    nivelEducativo: p.nivelEducativo,
    estadoCivil: p.estadoCivil,
    disposicionBase: p.disposicionBase,
    rasgos: p.rasgos,
    valores: p.valores,
    historiaPersonal: p.historiaPersonal,
    objecionesTipicas: p.objecionesTipicas,
    canalPreferido: p.canalPreferido,
    llmProviderOverride: null,
    llmModelOverride: null
  }))

  return { formatVersion: 1, nombre: panel.nombre, descripcionPublica, autorPublico, personas: personaDrafts }
}

export function parseMarketplaceTemplate(jsonText: string): MarketplacePanelTemplate {
  const parsed: unknown = JSON.parse(jsonText)
  return templateSchema.parse(parsed) as MarketplacePanelTemplate
}

export interface BundledTemplate {
  fileName: string
  template: MarketplacePanelTemplate
}

/**
 * Templates that ship with the app, contributed via commits/PRs to `resources/templates/*.json` —
 * anyone can drop a new template file in that folder (same format the app's own export produces) and
 * it shows up here on the next release.
 */
export function listBundledTemplates(): BundledTemplate[] {
  const dir = resolveBundledResourceDir('templates')
  if (!fs.existsSync(dir)) return []

  const results: BundledTemplate[] = []
  for (const fileName of fs.readdirSync(dir)) {
    if (!fileName.endsWith('.json')) continue
    try {
      const content = fs.readFileSync(path.join(dir, fileName), 'utf-8')
      results.push({ fileName, template: parseMarketplaceTemplate(content) })
    } catch {
      // Skip malformed template files rather than failing the whole list — surfaced in dev via logs.
      console.warn(`[marketplace] skipping invalid template file: ${fileName}`)
    }
  }
  return results.sort((a, b) => a.template.nombre.localeCompare(b.template.nombre))
}

const REPO_OWNER = 'Brokenwatch24'
const REPO_NAME = 'crowdmind'
const TEMPLATES_PATH = 'resources/templates'

interface GitHubContentEntry {
  name: string
  download_url: string | null
}

/**
 * Fetches whatever templates are currently in `resources/templates/` on the repo's default branch —
 * lets new community-contributed templates show up immediately after merge, without waiting for the
 * next app release/auto-update. Best-effort: any network/parse failure just yields fewer templates,
 * never throws (this is a "nice to have" refresh, not core functionality).
 */
export async function fetchRemoteTemplates(): Promise<BundledTemplate[]> {
  try {
    const listRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${TEMPLATES_PATH}`, {
      headers: { Accept: 'application/vnd.github+json' }
    })
    if (!listRes.ok) return []
    const entries = (await listRes.json()) as GitHubContentEntry[]

    const results: BundledTemplate[] = []
    for (const entry of entries) {
      if (!entry.name.endsWith('.json') || !entry.download_url) continue
      try {
        const fileRes = await fetch(entry.download_url)
        if (!fileRes.ok) continue
        const content = await fileRes.text()
        results.push({ fileName: entry.name, template: parseMarketplaceTemplate(content) })
      } catch {
        // skip this one file, keep going
      }
    }
    return results.sort((a, b) => a.template.nombre.localeCompare(b.template.nombre))
  } catch {
    return []
  }
}
