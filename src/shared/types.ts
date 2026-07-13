export type ProviderId = 'openai' | 'anthropic' | 'gemini' | 'openrouter' | 'local'

export const PROVIDER_IDS: ProviderId[] = ['openai', 'anthropic', 'gemini', 'openrouter', 'local']

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Google Gemini',
  openrouter: 'OpenRouter',
  local: 'Local (sin conexión)'
}

export const PROVIDER_DEFAULT_MODELS: Record<ProviderId, string[]> = {
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1', 'gpt-4.1-nano', 'o4-mini', 'o3-mini'],
  anthropic: ['claude-sonnet-5', 'claude-haiku-4-5-20251001', 'claude-opus-4-8', 'claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest'],
  gemini: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  openrouter: [
    'openai/gpt-4o-mini',
    'openai/gpt-4.1',
    'anthropic/claude-sonnet-5',
    'google/gemini-2.5-pro',
    'meta-llama/llama-3.1-70b-instruct',
    'mistralai/mistral-large'
  ],
  local: ['local-deterministic-v1']
}

export type DisposicionBase = 'entusiasta' | 'neutro' | 'esceptico' | 'hostil'

export const DISPOSICIONES: DisposicionBase[] = ['entusiasta', 'neutro', 'esceptico', 'hostil']

export type NivelIngreso = 'bajo' | 'medio' | 'alto'

export const NIVELES_INGRESO: NivelIngreso[] = ['bajo', 'medio', 'alto']

export type EstimuloTipo = 'texto' | 'imagen' | 'multimodal'

export type EstimuloAttachmentType = 'image' | 'pdf' | 'file'

/** Attachments are carried as data: URIs (base64) so tests remain local-first without external file storage. */
export interface EstimuloAttachment {
  id: string
  type: EstimuloAttachmentType
  name: string
  mimeType: string
  dataUri: string
  sizeBytes: number
}

/** Image is carried as a data: URI (base64) — small enough for a single stimulus image, no file storage needed. */
export interface EstimuloMetadata {
  /** Legacy single-image field kept for backward compatibility with tests created before attachments. */
  imagenDataUri?: string
  attachments?: EstimuloAttachment[]
}

export type TestTipo = 'simple' | 'funnel'

export type ModoInteraccion = 'individual' | 'focus_group'

export interface Workspace {
  id: string
  nombre: string
  createdAt: number
}

export type NoteScopeType = 'workspace' | 'panel' | 'test'

export interface Note {
  id: string
  scopeType: NoteScopeType
  scopeId: string
  title: string
  contentMarkdown: string
  createdAt: number
  updatedAt: number
}

export interface ProviderSetting {
  id: string
  workspaceId: string | null
  provider: ProviderId
  hasApiKey: boolean
  defaultModel: string
}

export interface Panel {
  id: string
  workspaceId: string
  nombre: string
  descripcion: string
  color: string
  esPublico: boolean
  descripcionPublica: string | null
  autorPublico: string | null
  createdAt: number
  personaCount?: number
}

export interface Persona {
  id: string
  panelId: string
  nombre: string
  edad: number
  genero: string
  ciudad: string
  pais: string
  ocupacion: string
  nivelIngreso: NivelIngreso
  nivelEducativo: string
  estadoCivil: string
  disposicionBase: DisposicionBase
  rasgos: string[]
  valores: string[]
  historiaPersonal: string
  objecionesTipicas: string[]
  canalPreferido: string
  avatarSeed: string
  /** User-uploaded or AI-generated profile photo (data: URI) — overrides the deterministic gradient avatar when set. */
  avatarImageDataUri: string | null
  llmProviderOverride: ProviderId | null
  llmModelOverride: string | null
  createdAt: number
  updatedAt: number
}

export type PersonaDraft = Omit<Persona, 'id' | 'panelId' | 'createdAt' | 'updatedAt' | 'avatarSeed' | 'avatarImageDataUri'> & {
  avatarSeed?: string
  avatarImageDataUri?: string | null
}

export interface PersonaGenerationInput {
  workspaceId: string
  panelId: string
  count: number
  audience: string
  market: string
  productContext: string
  researchGoal: string
  mustInclude: string
  mustAvoid: string
  diversityAxes: string
  tone: string
  notes: string
  batchNonce: string
  provider: ProviderId
  model?: string
}

export interface PersonaImproveInput {
  workspaceId: string
  draft: PersonaDraft
  instructions: string
  provider: ProviderId
  model?: string
}

export interface InterviewPersonaResult {
  personaId: string
  personaNombre: string
  respuesta: string
}

export type PersonaSnapshot = Omit<Persona, 'id' | 'panelId' | 'createdAt' | 'updatedAt'>

export interface PersonaVersion {
  id: string
  personaId: string
  snapshot: PersonaSnapshot
  diffResumen: string
  createdAt: number
}

export interface EtapaFunnel {
  id: string
  testId: string
  orden: number
  tipoEstimulo: EstimuloTipo
  estimuloContenido: string
  estimuloMetadata: EstimuloMetadata
  titulo: string
  createdAt: number
}

export type EtapaFunnelDraft = Omit<EtapaFunnel, 'id' | 'testId' | 'createdAt'>

export interface FunnelTemplate {
  formatVersion: 1
  nombre: string
  descripcion: string
  etapas: Array<{ titulo: string; estimuloContenido: string }>
}

export interface ConfianzaBreakdown {
  tamanoMuestra: number
  desviacionScores: number
  segmentosCubiertos: number
  segmentosTotales: number
}

export interface CrowdmindTest {
  id: string
  workspaceId: string
  panelId: string
  nombre: string
  tipo: TestTipo
  modoInteraccion: ModoInteraccion
  estimuloTipo: EstimuloTipo
  estimuloContenido: string
  estimuloMetadata: EstimuloMetadata
  scorecardCriteria: string[]
  resumenEjecutivo: string | null
  disclaimers: string[]
  indiceConfianza: number | null
  confianzaBreakdown: ConfianzaBreakdown | null
  createdAt: number
}

export interface Respuesta {
  id: string
  testId: string
  personaId: string
  etapaFunnelId: string | null
  avanzoASiguienteEtapa: boolean | null
  personaVersionId: string | null
  scoreSatisfaccion: number
  scorecardScores: Record<string, number>
  opinionTexto: string
  objeciones: string[]
  aspectosPositivos: string[]
  modeloUsadoProvider: ProviderId
  modeloUsadoModel: string
  createdAt: number
}

export interface RespuestaConPersona extends Respuesta {
  persona: Persona
}

export interface ChatMensaje {
  id: string
  personaId: string
  role: 'user' | 'persona'
  contenido: string
  createdAt: number
}

export interface TestResultSummary {
  test: CrowdmindTest
  respuestas: RespuestaConPersona[]
  scorePromedio: number
  distribucion: { positivo: number; neutro: number; negativo: number }
  scorecardPromedios: Record<string, number>
  benchmark: { previousTests: number; previousAverage: number | null; delta: number | null }
}

export interface FunnelStageResult {
  etapa: EtapaFunnel
  respuestas: RespuestaConPersona[]
  entraron: number
  avanzaron: number
}

export interface FunnelResultSummary {
  test: CrowdmindTest
  etapas: FunnelStageResult[]
}

export interface FollowUp {
  id: string
  testId: string
  pregunta: string
  personaIdsIncluidas: string[]
  createdAt: number
}

export interface FollowUpRespuesta {
  id: string
  followUpId: string
  personaId: string
  respuestaTexto: string
  createdAt: number
}

export interface FollowUpRespuestaConPersona extends FollowUpRespuesta {
  persona: Persona
}

export interface FollowUpResultSummary {
  followUp: FollowUp
  respuestas: FollowUpRespuestaConPersona[]
}

export interface TemaTest {
  id: string
  testId: string
  nombreTema: string
  cantidadMenciones: number
  personasRepresentativas: Array<{ personaId: string; quote: string }>
  createdAt: number
}

export type ComparacionModo = 'mismo_panel_dos_estimulos' | 'mismo_estimulo_dos_paneles'

export interface Comparacion {
  id: string
  workspaceId: string
  modo: ComparacionModo
  testAId: string
  testBId: string
  createdAt: number
}

export interface ComparacionPersonaDelta {
  personaId: string
  personaNombre: string
  scoreA: number | null
  scoreB: number | null
  delta: number | null
}

export interface ComparacionResult {
  comparacion: Comparacion
  testA: TestResultSummary
  testB: TestResultSummary
  deltas: ComparacionPersonaDelta[]
  scorePromedioDelta: number
}

export interface PanelTimelinePoint {
  testId: string
  nombre: string
  tipo: TestTipo
  estimuloContenido: string
  scorePromedio: number
  createdAt: number
}

export interface CsvColumnMapping {
  [csvColumn: string]: keyof PersonaDraft | ''
}

export interface CsvPreview {
  filePath: string
  headers: string[]
  sampleRows: Record<string, string>[]
}

export const CSV_MAPPABLE_FIELDS: Array<{ field: keyof PersonaDraft; label: string }> = [
  { field: 'nombre', label: 'Nombre' },
  { field: 'edad', label: 'Edad' },
  { field: 'genero', label: 'Género' },
  { field: 'ciudad', label: 'Ciudad' },
  { field: 'pais', label: 'País' },
  { field: 'ocupacion', label: 'Ocupación' },
  { field: 'nivelIngreso', label: 'Nivel de ingreso' },
  { field: 'nivelEducativo', label: 'Nivel educativo' },
  { field: 'estadoCivil', label: 'Estado civil' },
  { field: 'disposicionBase', label: 'Disposición base' },
  { field: 'rasgos', label: 'Rasgos (lista)' },
  { field: 'valores', label: 'Valores (lista)' },
  { field: 'historiaPersonal', label: 'Historia personal' },
  { field: 'objecionesTipicas', label: 'Objeciones típicas (lista)' },
  { field: 'canalPreferido', label: 'Canal preferido' }
]

export interface MarketplacePanelTemplate {
  formatVersion: 1
  nombre: string
  descripcionPublica: string
  autorPublico: string
  personas: PersonaDraft[]
}

export type UpdateStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'not-available'; checkedAt?: number }
  | { state: 'available'; version: string; releaseName?: string; releaseNotes?: string; releaseDate?: string }
  | { state: 'downloading'; version?: string; percent: number; transferred?: number; total?: number; bytesPerSecond?: number }
  | { state: 'downloaded'; version: string; releaseName?: string; releaseNotes?: string; releaseDate?: string }
  | { state: 'error'; message: string }

export function sentimentBucket(score: number): 'positivo' | 'neutro' | 'negativo' {
  if (score >= 7) return 'positivo'
  if (score >= 4) return 'neutro'
  return 'negativo'
}

export function confidenceLevel(indice: number | null): 'alta' | 'media' | 'baja' | 'desconocida' {
  if (indice === null) return 'desconocida'
  if (indice >= 70) return 'alta'
  if (indice >= 40) return 'media'
  return 'baja'
}
