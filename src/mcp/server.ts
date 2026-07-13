import { DatabaseSync } from 'node:sqlite'
import { randomUUID } from 'node:crypto'
import { createInterface } from 'node:readline'
import type { Persona, PersonaDraft } from '@shared/types'
import { generatePersonasLocal } from '../main/llm/local/personaGenerator'
import { respondToStimulusLocal } from '../main/llm/local/testResponder'

type JsonRpcRequest = { jsonrpc?: '2.0'; id?: string | number | null; method: string; params?: any }

function argValue(name: string): string | null {
  const idx = process.argv.indexOf(name)
  return idx >= 0 ? process.argv[idx + 1] ?? null : null
}

const dbPath = argValue('--db') ?? process.env.CROWDMIND_DB_PATH
if (!dbPath) {
  console.error('CrowdMind MCP requires --db <path> or CROWDMIND_DB_PATH.')
  process.exit(1)
}

const db = new DatabaseSync(dbPath)

function now(): number {
  return Date.now()
}

function toJsonArray(value: unknown): string {
  return JSON.stringify(Array.isArray(value) ? value : [])
}

function toPersona(row: any): Persona {
  return {
    id: row.id,
    panelId: row.panel_id,
    nombre: row.nombre,
    edad: row.edad,
    genero: row.genero,
    ciudad: row.ciudad,
    pais: row.pais,
    ocupacion: row.ocupacion,
    nivelIngreso: row.nivel_ingreso,
    nivelEducativo: row.nivel_educativo,
    estadoCivil: row.estado_civil,
    disposicionBase: row.disposicion_base,
    rasgos: JSON.parse(row.rasgos_json ?? '[]'),
    valores: JSON.parse(row.valores_json ?? '[]'),
    historiaPersonal: row.historia_personal ?? '',
    objecionesTipicas: JSON.parse(row.objeciones_tipicas_json ?? '[]'),
    canalPreferido: row.canal_preferido ?? '',
    avatarSeed: row.avatar_seed,
    avatarImageDataUri: row.avatar_image_data_uri ?? null,
    llmProviderOverride: row.llm_provider_override ?? null,
    llmModelOverride: row.llm_model_override ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function insertPersona(panelId: string, draft: PersonaDraft): Persona {
  const timestamp = now()
  const row = {
    id: randomUUID(),
    panel_id: panelId,
    nombre: draft.nombre,
    edad: draft.edad,
    genero: draft.genero,
    ciudad: draft.ciudad,
    pais: draft.pais,
    ocupacion: draft.ocupacion,
    nivel_ingreso: draft.nivelIngreso,
    nivel_educativo: draft.nivelEducativo,
    estado_civil: draft.estadoCivil,
    disposicion_base: draft.disposicionBase,
    rasgos_json: toJsonArray(draft.rasgos),
    valores_json: toJsonArray(draft.valores),
    historia_personal: draft.historiaPersonal ?? '',
    objeciones_tipicas_json: toJsonArray(draft.objecionesTipicas),
    canal_preferido: draft.canalPreferido ?? '',
    avatar_seed: draft.avatarSeed ?? `${draft.nombre}-${randomUUID()}`,
    avatar_image_data_uri: draft.avatarImageDataUri ?? null,
    llm_provider_override: draft.llmProviderOverride ?? null,
    llm_model_override: draft.llmModelOverride ?? null,
    created_at: timestamp,
    updated_at: timestamp
  }
  db.prepare(
    `INSERT INTO personas (
      id, panel_id, nombre, edad, genero, ciudad, pais, ocupacion, nivel_ingreso, nivel_educativo,
      estado_civil, disposicion_base, rasgos_json, valores_json, historia_personal, objeciones_tipicas_json,
      canal_preferido, avatar_seed, avatar_image_data_uri, llm_provider_override, llm_model_override, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?
    )`
  ).run(
    row.id,
    row.panel_id,
    row.nombre,
    row.edad,
    row.genero,
    row.ciudad,
    row.pais,
    row.ocupacion,
    row.nivel_ingreso,
    row.nivel_educativo,
    row.estado_civil,
    row.disposicion_base,
    row.rasgos_json,
    row.valores_json,
    row.historia_personal,
    row.objeciones_tipicas_json,
    row.canal_preferido,
    row.avatar_seed,
    row.avatar_image_data_uri,
    row.llm_provider_override,
    row.llm_model_override,
    row.created_at,
    row.updated_at
  )
  return toPersona(row)
}

function compactPersona(p: Persona) {
  return {
    id: p.id,
    nombre: p.nombre,
    edad: p.edad,
    ciudad: p.ciudad,
    pais: p.pais,
    ocupacion: p.ocupacion,
    nivelIngreso: p.nivelIngreso,
    disposicionBase: p.disposicionBase,
    historiaPersonal: p.historiaPersonal
  }
}

const tools = [
  {
    name: 'list_workspaces',
    description: 'List CrowdMind workspaces from the configured SQLite database.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }
  },
  {
    name: 'list_panels',
    description: 'List panels for a workspace.',
    inputSchema: { type: 'object', properties: { workspaceId: { type: 'string' } }, required: ['workspaceId'] }
  },
  {
    name: 'create_panel',
    description: 'Create a new CrowdMind panel in a workspace.',
    inputSchema: {
      type: 'object',
      properties: { workspaceId: { type: 'string' }, nombre: { type: 'string' }, descripcion: { type: 'string' }, color: { type: 'string' } },
      required: ['workspaceId', 'nombre']
    }
  },
  {
    name: 'list_personas',
    description: 'List personas in a panel.',
    inputSchema: { type: 'object', properties: { panelId: { type: 'string' } }, required: ['panelId'] }
  },
  {
    name: 'generate_personas_preview',
    description: 'Generate local deterministic persona drafts for a panel brief.',
    inputSchema: {
      type: 'object',
      properties: { count: { type: 'number' }, brief: { type: 'string' }, batchNonce: { type: 'string' } },
      required: ['count', 'brief']
    }
  },
  {
    name: 'save_personas',
    description: 'Save persona drafts into a panel.',
    inputSchema: { type: 'object', properties: { panelId: { type: 'string' }, personas: { type: 'array' } }, required: ['panelId', 'personas'] }
  },
  {
    name: 'run_simple_test',
    description: 'Run a local deterministic simple test against all or selected panel personas.',
    inputSchema: {
      type: 'object',
      properties: { workspaceId: { type: 'string' }, panelId: { type: 'string' }, nombre: { type: 'string' }, estimulo: { type: 'string' }, personaIds: { type: 'array' } },
      required: ['workspaceId', 'panelId', 'estimulo']
    }
  },
  {
    name: 'list_tests',
    description: 'List tests in a panel.',
    inputSchema: { type: 'object', properties: { panelId: { type: 'string' } }, required: ['panelId'] }
  },
  {
    name: 'get_test_results',
    description: 'Get compact results for a CrowdMind test.',
    inputSchema: { type: 'object', properties: { testId: { type: 'string' } }, required: ['testId'] }
  },
  {
    name: 'get_test_report_markdown',
    description: 'Generate a compact executive Markdown report for a test.',
    inputSchema: { type: 'object', properties: { testId: { type: 'string' } }, required: ['testId'] }
  }
]

async function callTool(name: string, args: any): Promise<unknown> {
  if (name === 'list_workspaces') {
    return db.prepare('SELECT id, nombre, created_at AS createdAt FROM workspaces ORDER BY created_at DESC').all()
  }
  if (name === 'list_panels') {
    return db.prepare('SELECT id, workspace_id AS workspaceId, nombre, descripcion, color, created_at AS createdAt FROM paneles WHERE workspace_id = ? ORDER BY created_at DESC').all(args.workspaceId)
  }
  if (name === 'create_panel') {
    const panel = {
      id: randomUUID(),
      workspaceId: args.workspaceId,
      nombre: args.nombre,
      descripcion: args.descripcion ?? '',
      color: args.color ?? '#5eead4',
      createdAt: now()
    }
    db.prepare('INSERT INTO paneles (id, workspace_id, nombre, descripcion, color, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      panel.id,
      panel.workspaceId,
      panel.nombre,
      panel.descripcion,
      panel.color,
      panel.createdAt
    )
    return panel
  }
  if (name === 'list_personas') {
    return db.prepare('SELECT * FROM personas WHERE panel_id = ? ORDER BY nombre').all(args.panelId).map(toPersona).map(compactPersona)
  }
  if (name === 'generate_personas_preview') {
    return generatePersonasLocal(`${args.brief} | ${args.batchNonce ?? now()}`, Math.max(1, Math.min(30, Number(args.count) || 1)))
  }
  if (name === 'save_personas') {
    return (args.personas as PersonaDraft[]).map((p) => compactPersona(insertPersona(args.panelId, p)))
  }
  if (name === 'run_simple_test') {
    const testId = randomUUID()
    const timestamp = now()
    db.prepare(
      `INSERT INTO tests (id, workspace_id, panel_id, nombre, tipo, modo_interaccion, estimulo_tipo, estimulo_contenido, estimulo_metadata_json, scorecard_criteria_json, disclaimers_json, created_at)
       VALUES (?, ?, ?, ?, 'simple', 'individual', 'texto', ?, '{}', '[]', '[]', ?)`
    ).run(testId, args.workspaceId, args.panelId, args.nombre || 'MCP test', args.estimulo, timestamp)
    const rows = db.prepare('SELECT * FROM personas WHERE panel_id = ? ORDER BY nombre').all(args.panelId).map(toPersona)
    const include = new Set(Array.isArray(args.personaIds) ? args.personaIds : rows.map((p) => p.id))
    for (const persona of rows.filter((p) => include.has(p.id))) {
      const response = respondToStimulusLocal(persona, args.estimulo)
      db.prepare(
        `INSERT INTO respuestas (id, test_id, persona_id, score_satisfaccion, scorecard_scores_json, opinion_texto, objeciones_json, aspectos_positivos_json, modelo_usado_provider, modelo_usado_model, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'local', 'local-deterministic-v1', ?)`
      ).run(
        randomUUID(),
        testId,
        persona.id,
        response.scoreSatisfaccion,
        JSON.stringify(response.scorecardScores),
        response.opinionTexto,
        JSON.stringify(response.objeciones),
        JSON.stringify(response.aspectosPositivos),
        now()
      )
    }
    return { testId }
  }
  if (name === 'list_tests') {
    return db.prepare('SELECT id, workspace_id AS workspaceId, panel_id AS panelId, nombre, tipo, estimulo_contenido AS estimuloContenido, created_at AS createdAt FROM tests WHERE panel_id = ? ORDER BY created_at DESC').all(args.panelId)
  }
  if (name === 'get_test_results') {
    const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(args.testId)
    const respuestas = db.prepare('SELECT * FROM respuestas WHERE test_id = ? ORDER BY created_at').all(args.testId)
    return { test, respuestas }
  }
  if (name === 'get_test_report_markdown') {
    const test: any = db.prepare('SELECT * FROM tests WHERE id = ?').get(args.testId)
    if (!test) throw new Error('Test not found')
    const respuestas: any[] = db.prepare('SELECT * FROM respuestas WHERE test_id = ? ORDER BY created_at').all(args.testId)
    const scores = respuestas.map((r) => Number(r.score_satisfaccion))
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    const positives = respuestas.filter((r) => Number(r.score_satisfaccion) >= 7).length
    const objections = new Map<string, number>()
    for (const r of respuestas) {
      for (const obj of JSON.parse(r.objeciones_json ?? '[]')) objections.set(obj, (objections.get(obj) ?? 0) + 1)
    }
    const top = [...objections.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
    return [
      `# ${test.nombre}`,
      '',
      `**Score promedio:** ${avg.toFixed(1)}/10`,
      `**Respuestas:** ${respuestas.length}`,
      `**Positivas:** ${positives}`,
      '',
      '## Estimulo',
      test.estimulo_contenido,
      '',
      '## Objeciones principales',
      ...(top.length ? top.map(([o, c]) => `- ${o} (${c})`) : ['- Sin objeciones recurrentes.'])
    ].join('\n')
  }
  throw new Error(`Unknown tool: ${name}`)
}

function send(id: JsonRpcRequest['id'], result: unknown) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, result })}\n`)
}

function sendError(id: JsonRpcRequest['id'], error: unknown) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, error: { code: -32000, message: error instanceof Error ? error.message : String(error) } })}\n`)
}

const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: false })
rl.on('line', async (line) => {
  if (!line.trim()) return
  const req = JSON.parse(line) as JsonRpcRequest
  try {
    if (req.method === 'initialize') {
      send(req.id, { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'crowdmind', version: '0.1.0' } })
    } else if (req.method === 'tools/list') {
      send(req.id, { tools })
    } else if (req.method === 'tools/call') {
      const result = await callTool(req.params.name, req.params.arguments ?? {})
      send(req.id, { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] })
    } else if (req.id !== undefined) {
      send(req.id, {})
    }
  } catch (err) {
    sendError(req.id, err)
  }
})
