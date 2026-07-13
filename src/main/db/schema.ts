import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const workspaces = sqliteTable('workspaces', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  createdAt: integer('created_at').notNull()
})

export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  scopeType: text('scope_type').notNull(),
  scopeId: text('scope_id').notNull(),
  title: text('title').notNull(),
  contentMarkdown: text('content_markdown').notNull().default(''),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})

export const providerSettings = sqliteTable('provider_settings', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id'),
  provider: text('provider').notNull(),
  apiKeyEncrypted: text('api_key_encrypted'),
  apiKeyPlaintextFallback: integer('api_key_plaintext_fallback', { mode: 'boolean' }).notNull().default(false),
  defaultModel: text('default_model').notNull()
})

export const paneles = sqliteTable('paneles', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull(),
  nombre: text('nombre').notNull(),
  descripcion: text('descripcion').notNull().default(''),
  color: text('color').notNull(),
  esPublico: integer('es_publico', { mode: 'boolean' }).notNull().default(false),
  descripcionPublica: text('descripcion_publica'),
  autorPublico: text('autor_publico'),
  createdAt: integer('created_at').notNull()
})

export const personas = sqliteTable('personas', {
  id: text('id').primaryKey(),
  panelId: text('panel_id').notNull(),
  nombre: text('nombre').notNull(),
  edad: integer('edad').notNull(),
  genero: text('genero').notNull(),
  ciudad: text('ciudad').notNull(),
  pais: text('pais').notNull(),
  ocupacion: text('ocupacion').notNull(),
  nivelIngreso: text('nivel_ingreso').notNull(),
  nivelEducativo: text('nivel_educativo').notNull(),
  estadoCivil: text('estado_civil').notNull(),
  disposicionBase: text('disposicion_base').notNull(),
  rasgosJson: text('rasgos_json').notNull().default('[]'),
  valoresJson: text('valores_json').notNull().default('[]'),
  historiaPersonal: text('historia_personal').notNull().default(''),
  objecionesTipicasJson: text('objeciones_tipicas_json').notNull().default('[]'),
  canalPreferido: text('canal_preferido').notNull().default(''),
  avatarSeed: text('avatar_seed').notNull(),
  avatarImageDataUri: text('avatar_image_data_uri'),
  llmProviderOverride: text('llm_provider_override'),
  llmModelOverride: text('llm_model_override'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})

export const tests = sqliteTable('tests', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull(),
  panelId: text('panel_id').notNull(),
  nombre: text('nombre').notNull(),
  tipo: text('tipo').notNull().default('simple'),
  modoInteraccion: text('modo_interaccion').notNull().default('individual'),
  estimuloTipo: text('estimulo_tipo').notNull().default('texto'),
  estimuloContenido: text('estimulo_contenido').notNull(),
  estimuloMetadataJson: text('estimulo_metadata_json').notNull().default('{}'),
  scorecardCriteriaJson: text('scorecard_criteria_json').notNull().default('[]'),
  resumenEjecutivo: text('resumen_ejecutivo'),
  disclaimersJson: text('disclaimers_json').notNull().default('[]'),
  indiceConfianza: integer('indice_confianza'),
  confianzaBreakdownJson: text('confianza_breakdown_json'),
  createdAt: integer('created_at').notNull()
})

export const etapasFunnel = sqliteTable('etapas_funnel', {
  id: text('id').primaryKey(),
  testId: text('test_id').notNull(),
  orden: integer('orden').notNull(),
  tipoEstimulo: text('tipo_estimulo').notNull().default('texto'),
  estimuloContenido: text('estimulo_contenido').notNull(),
  estimuloMetadataJson: text('estimulo_metadata_json').notNull().default('{}'),
  titulo: text('titulo').notNull().default(''),
  createdAt: integer('created_at').notNull()
})

export const followUps = sqliteTable('follow_ups', {
  id: text('id').primaryKey(),
  testId: text('test_id').notNull(),
  pregunta: text('pregunta').notNull(),
  personaIdsIncluidasJson: text('persona_ids_incluidas_json').notNull().default('[]'),
  createdAt: integer('created_at').notNull()
})

export const followUpRespuestas = sqliteTable('follow_up_respuestas', {
  id: text('id').primaryKey(),
  followUpId: text('follow_up_id').notNull(),
  personaId: text('persona_id').notNull(),
  respuestaTexto: text('respuesta_texto').notNull(),
  createdAt: integer('created_at').notNull()
})

export const personaVersiones = sqliteTable('persona_versiones', {
  id: text('id').primaryKey(),
  personaId: text('persona_id').notNull(),
  snapshotJson: text('snapshot_json').notNull(),
  diffResumen: text('diff_resumen').notNull().default(''),
  createdAt: integer('created_at').notNull()
})

export const temasTest = sqliteTable('temas_test', {
  id: text('id').primaryKey(),
  testId: text('test_id').notNull(),
  nombreTema: text('nombre_tema').notNull(),
  cantidadMenciones: integer('cantidad_menciones').notNull().default(0),
  personasRepresentativasJson: text('personas_representativas_json').notNull().default('[]'),
  createdAt: integer('created_at').notNull()
})

export const comparaciones = sqliteTable('comparaciones', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull(),
  modo: text('modo').notNull(),
  testAId: text('test_a_id').notNull(),
  testBId: text('test_b_id').notNull(),
  createdAt: integer('created_at').notNull()
})

export const respuestas = sqliteTable('respuestas', {
  id: text('id').primaryKey(),
  testId: text('test_id').notNull(),
  personaId: text('persona_id').notNull(),
  etapaFunnelId: text('etapa_funnel_id'),
  avanzoASiguienteEtapa: integer('avanzo_a_siguiente_etapa', { mode: 'boolean' }),
  personaVersionId: text('persona_version_id'),
  scoreSatisfaccion: integer('score_satisfaccion').notNull(),
  scorecardScoresJson: text('scorecard_scores_json').notNull().default('{}'),
  opinionTexto: text('opinion_texto').notNull(),
  objecionesJson: text('objeciones_json').notNull().default('[]'),
  aspectosPositivosJson: text('aspectos_positivos_json').notNull().default('[]'),
  modeloUsadoProvider: text('modelo_usado_provider').notNull(),
  modeloUsadoModel: text('modelo_usado_model').notNull(),
  createdAt: integer('created_at').notNull()
})

export const chatMensajes = sqliteTable('chat_mensajes', {
  id: text('id').primaryKey(),
  personaId: text('persona_id').notNull(),
  role: text('role').notNull(),
  contenido: text('contenido').notNull(),
  createdAt: integer('created_at').notNull()
})
