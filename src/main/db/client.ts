import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  scope_type TEXT NOT NULL,
  scope_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content_markdown TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS notes_scope_idx ON notes (scope_type, scope_id);

CREATE TABLE IF NOT EXISTS provider_settings (
  id TEXT PRIMARY KEY,
  workspace_id TEXT,
  provider TEXT NOT NULL,
  api_key_encrypted TEXT,
  api_key_plaintext_fallback INTEGER NOT NULL DEFAULT 0,
  default_model TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS provider_settings_scope_idx
  ON provider_settings (provider, COALESCE(workspace_id, ''));

CREATE TABLE IF NOT EXISTS paneles (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL,
  es_publico INTEGER NOT NULL DEFAULT 0,
  descripcion_publica TEXT,
  autor_publico TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS paneles_workspace_idx ON paneles (workspace_id);

CREATE TABLE IF NOT EXISTS personas (
  id TEXT PRIMARY KEY,
  panel_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  edad INTEGER NOT NULL,
  genero TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  pais TEXT NOT NULL,
  ocupacion TEXT NOT NULL,
  nivel_ingreso TEXT NOT NULL,
  nivel_educativo TEXT NOT NULL,
  estado_civil TEXT NOT NULL,
  disposicion_base TEXT NOT NULL,
  rasgos_json TEXT NOT NULL DEFAULT '[]',
  valores_json TEXT NOT NULL DEFAULT '[]',
  historia_personal TEXT NOT NULL DEFAULT '',
  objeciones_tipicas_json TEXT NOT NULL DEFAULT '[]',
  canal_preferido TEXT NOT NULL DEFAULT '',
  avatar_seed TEXT NOT NULL,
  llm_provider_override TEXT,
  llm_model_override TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS personas_panel_idx ON personas (panel_id);

CREATE TABLE IF NOT EXISTS tests (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  panel_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'simple',
  modo_interaccion TEXT NOT NULL DEFAULT 'individual',
  estimulo_tipo TEXT NOT NULL DEFAULT 'texto',
  estimulo_contenido TEXT NOT NULL,
  estimulo_metadata_json TEXT NOT NULL DEFAULT '{}',
  scorecard_criteria_json TEXT NOT NULL DEFAULT '[]',
  resumen_ejecutivo TEXT,
  disclaimers_json TEXT NOT NULL DEFAULT '[]',
  indice_confianza INTEGER,
  confianza_breakdown_json TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS tests_panel_idx ON tests (panel_id);

CREATE TABLE IF NOT EXISTS etapas_funnel (
  id TEXT PRIMARY KEY,
  test_id TEXT NOT NULL,
  orden INTEGER NOT NULL,
  tipo_estimulo TEXT NOT NULL DEFAULT 'texto',
  estimulo_contenido TEXT NOT NULL,
  estimulo_metadata_json TEXT NOT NULL DEFAULT '{}',
  titulo TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS etapas_funnel_test_idx ON etapas_funnel (test_id);

CREATE TABLE IF NOT EXISTS follow_ups (
  id TEXT PRIMARY KEY,
  test_id TEXT NOT NULL,
  pregunta TEXT NOT NULL,
  persona_ids_incluidas_json TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS follow_ups_test_idx ON follow_ups (test_id);

CREATE TABLE IF NOT EXISTS follow_up_respuestas (
  id TEXT PRIMARY KEY,
  follow_up_id TEXT NOT NULL,
  persona_id TEXT NOT NULL,
  respuesta_texto TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS follow_up_respuestas_followup_idx ON follow_up_respuestas (follow_up_id);

CREATE TABLE IF NOT EXISTS persona_versiones (
  id TEXT PRIMARY KEY,
  persona_id TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  diff_resumen TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS persona_versiones_persona_idx ON persona_versiones (persona_id);

CREATE TABLE IF NOT EXISTS temas_test (
  id TEXT PRIMARY KEY,
  test_id TEXT NOT NULL,
  nombre_tema TEXT NOT NULL,
  cantidad_menciones INTEGER NOT NULL DEFAULT 0,
  personas_representativas_json TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS temas_test_test_idx ON temas_test (test_id);

CREATE TABLE IF NOT EXISTS comparaciones (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  modo TEXT NOT NULL,
  test_a_id TEXT NOT NULL,
  test_b_id TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS comparaciones_workspace_idx ON comparaciones (workspace_id);

CREATE TABLE IF NOT EXISTS respuestas (
  id TEXT PRIMARY KEY,
  test_id TEXT NOT NULL,
  persona_id TEXT NOT NULL,
  etapa_funnel_id TEXT,
  avanzo_a_siguiente_etapa INTEGER,
  persona_version_id TEXT,
  score_satisfaccion INTEGER NOT NULL,
  scorecard_scores_json TEXT NOT NULL DEFAULT '{}',
  opinion_texto TEXT NOT NULL,
  objeciones_json TEXT NOT NULL DEFAULT '[]',
  aspectos_positivos_json TEXT NOT NULL DEFAULT '[]',
  modelo_usado_provider TEXT NOT NULL,
  modelo_usado_model TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS respuestas_test_idx ON respuestas (test_id);
CREATE INDEX IF NOT EXISTS respuestas_persona_idx ON respuestas (persona_id);

CREATE TABLE IF NOT EXISTS chat_mensajes (
  id TEXT PRIMARY KEY,
  persona_id TEXT NOT NULL,
  role TEXT NOT NULL,
  contenido TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS chat_mensajes_persona_idx ON chat_mensajes (persona_id);
`

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null
let sqliteInstance: Database.Database | null = null

export function getDbPath(): string {
  const userData = app.getPath('userData')
  if (!fs.existsSync(userData)) fs.mkdirSync(userData, { recursive: true })
  return path.join(userData, 'crowdmind.sqlite')
}

/**
 * SQLite has no `ADD COLUMN IF NOT EXISTS`. Since the bootstrap above only creates tables that don't
 * exist yet, columns added to already-shipped tables (paneles, tests) in later versions need this
 * additive, idempotent backfill so upgrading an existing local DB never loses data.
 */
function ensureColumn(sqlite: Database.Database, table: string, column: string, ddl: string): void {
  const info = sqlite.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>
  if (!info.some((c) => c.name === column)) {
    sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`)
  }
}

function runAdditiveMigrations(sqlite: Database.Database): void {
  ensureColumn(sqlite, 'paneles', 'es_publico', "INTEGER NOT NULL DEFAULT 0")
  ensureColumn(sqlite, 'paneles', 'descripcion_publica', 'TEXT')
  ensureColumn(sqlite, 'paneles', 'autor_publico', 'TEXT')
  ensureColumn(sqlite, 'tests', 'modo_interaccion', "TEXT NOT NULL DEFAULT 'individual'")
  ensureColumn(sqlite, 'tests', 'disclaimers_json', "TEXT NOT NULL DEFAULT '[]'")
  ensureColumn(sqlite, 'tests', 'indice_confianza', 'INTEGER')
  ensureColumn(sqlite, 'tests', 'confianza_breakdown_json', 'TEXT')
  ensureColumn(sqlite, 'tests', 'scorecard_criteria_json', "TEXT NOT NULL DEFAULT '[]'")
  ensureColumn(sqlite, 'personas', 'avatar_image_data_uri', 'TEXT')
  ensureColumn(sqlite, 'respuestas', 'scorecard_scores_json', "TEXT NOT NULL DEFAULT '{}'")
}

export function getDb() {
  if (dbInstance) return dbInstance
  const sqlite = new Database(getDbPath())
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  sqlite.exec(SCHEMA_SQL)
  runAdditiveMigrations(sqlite)
  sqliteInstance = sqlite
  dbInstance = drizzle(sqlite, { schema })
  return dbInstance
}

export function closeDb() {
  sqliteInstance?.close()
  sqliteInstance = null
  dbInstance = null
}
