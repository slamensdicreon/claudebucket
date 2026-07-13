import type {
  ChatMensaje,
  EstimuloAttachment,
  EtapaFunnel,
  Persona,
  PersonaDraft,
  PersonaGenerationInput,
  ProviderId,
  RespuestaConPersona
} from '@shared/types'
import { providerRegistry } from './providerRegistry'
import { generatePersonasLocal } from './local/personaGenerator'
import { respondToStimulusLocal, type LocalRespuesta } from './local/testResponder'
import { chatReplyLocal } from './local/chatReplier'
import { confidenceDisclaimerLocal } from './local/confidenceDisclaimer'
import { resumenEjecutivoLocal } from './local/resumenEjecutivo'
import { temasExtractorLocal, type LocalTema } from './local/temasExtractor'
import { followUpReplyLocal } from './local/followUpReplier'
import { funnelStageResponseLocal, type LocalFunnelRespuesta } from './local/funnelResponder'
import {
  personaGenSchema,
  personaImproveSchema,
  testResponseSchema,
  chatReplySchema,
  confidenceDisclaimersSchema,
  resumenEjecutivoSchema,
  temasExtraccionSchema,
  funnelStageResponseSchema,
  PERSONA_GEN_SHAPE_HINT,
  PERSONA_IMPROVE_SHAPE_HINT,
  TEST_RESPONSE_SHAPE_HINT,
  CHAT_REPLY_SHAPE_HINT,
  CONFIDENCE_DISCLAIMERS_SHAPE_HINT,
  RESUMEN_EJECUTIVO_SHAPE_HINT,
  TEMAS_EXTRACCION_SHAPE_HINT,
  FUNNEL_STAGE_RESPONSE_SHAPE_HINT
} from './schemas'
import {
  personaGenSystemPrompt,
  personaGenUserPrompt,
  personaGenStructuredUserPrompt,
  personaImproveSystemPrompt,
  personaImproveUserPrompt,
  personaSystemPrompt,
  testStimulusUserPromptWithScorecard,
  chatUserPrompt,
  followUpUserPrompt,
  confidenceDisclaimersSystemPrompt,
  confidenceDisclaimersUserPrompt,
  resumenEjecutivoSystemPrompt,
  resumenEjecutivoUserPrompt,
  temasSystemPrompt,
  temasUserPrompt,
  funnelStageUserPromptWithScorecard,
  responseLanguageInstruction,
  type EtapaPropiaHistorial,
  type ResponseLanguage
} from './promptTemplates'

export interface ProviderCall {
  provider: ProviderId
  apiKey: string | null
  model: string
}

function generationInputToBrief(input: PersonaGenerationInput): string {
  return [
    input.audience,
    input.market,
    input.productContext,
    input.researchGoal,
    input.mustInclude,
    input.mustAvoid,
    input.diversityAxes,
    input.tone,
    input.notes,
    input.batchNonce
  ]
    .filter(Boolean)
    .join(' | ')
}

function normalizeGeneratedPersona(p: Omit<PersonaDraft, 'llmProviderOverride' | 'llmModelOverride'>): PersonaDraft {
  return { ...p, llmProviderOverride: null, llmModelOverride: null }
}

function hasVisualContext(attachments: EstimuloAttachment[] = [], imageDataUri?: string): boolean {
  return Boolean(imageDataUri) || attachments.length > 0
}

export async function generatePersonasWithAi(
  call: ProviderCall,
  inputOrBrief: PersonaGenerationInput | string,
  count?: number,
  existingPersonas: Persona[] = []
): Promise<PersonaDraft[]> {
  if (call.provider === 'local') {
    if (typeof inputOrBrief === 'string') return generatePersonasLocal(inputOrBrief, count ?? 1)
    return generatePersonasLocal(generationInputToBrief(inputOrBrief), inputOrBrief.count)
  }
  const structured = typeof inputOrBrief !== 'string'
  const result = await providerRegistry[call.provider].chatJson({
    apiKey: call.apiKey,
    model: call.model,
    system: personaGenSystemPrompt(),
    user: structured
      ? personaGenStructuredUserPrompt(inputOrBrief, existingPersonas)
      : personaGenUserPrompt(inputOrBrief, count ?? 1),
    schema: personaGenSchema,
    shapeHint: PERSONA_GEN_SHAPE_HINT
  })
  return result.personas.map(normalizeGeneratedPersona)
}

export async function improvePersonaDraftWithAi(
  call: ProviderCall,
  draft: PersonaDraft,
  instructions: string
): Promise<PersonaDraft> {
  if (call.provider === 'local') {
    const fallback = generatePersonasLocal(`${draft.nombre}-${draft.ocupacion}-${instructions}`, 1)[0]
    return {
      ...fallback,
      ...draft,
      nombre: draft.nombre.trim() || fallback.nombre,
      edad: draft.edad || fallback.edad,
      genero: draft.genero.trim() || fallback.genero,
      ciudad: draft.ciudad.trim() || fallback.ciudad,
      pais: draft.pais.trim() || fallback.pais,
      ocupacion: draft.ocupacion.trim() || fallback.ocupacion,
      nivelEducativo: draft.nivelEducativo.trim() || fallback.nivelEducativo,
      estadoCivil: draft.estadoCivil.trim() || fallback.estadoCivil,
      rasgos: draft.rasgos.length ? draft.rasgos : fallback.rasgos,
      valores: draft.valores.length ? draft.valores : fallback.valores,
      historiaPersonal:
        draft.historiaPersonal.trim() ||
        `${fallback.historiaPersonal} Sus decisiones de compra suelen depender de recomendaciones cercanas, precio percibido y confianza en la marca.`,
      objecionesTipicas: draft.objecionesTipicas.length ? draft.objecionesTipicas : fallback.objecionesTipicas,
      canalPreferido: draft.canalPreferido.trim() || fallback.canalPreferido,
      llmProviderOverride: draft.llmProviderOverride ?? null,
      llmModelOverride: draft.llmModelOverride ?? null
    }
  }
  const result = await providerRegistry[call.provider].chatJson({
    apiKey: call.apiKey,
    model: call.model,
    system: personaImproveSystemPrompt(),
    user: personaImproveUserPrompt(draft, instructions),
    schema: personaImproveSchema,
    shapeHint: PERSONA_IMPROVE_SHAPE_HINT
  })
  return normalizeGeneratedPersona(result.persona)
}

export async function getPersonaResponseToStimulus(
  call: ProviderCall,
  persona: Persona,
  estimulo: string,
  imageDataUri?: string,
  scorecardCriteria: string[] = [],
  attachments: EstimuloAttachment[] = [],
  responseLanguage: ResponseLanguage = 'es'
): Promise<LocalRespuesta> {
  const hasAttachments = hasVisualContext(attachments, imageDataUri)
  if (call.provider === 'local') {
    return respondToStimulusLocal(persona, estimulo, hasAttachments, scorecardCriteria)
  }
  const result = await providerRegistry[call.provider].chatJson({
    apiKey: call.apiKey,
    model: call.model,
    system: `${personaSystemPrompt(persona)} ${responseLanguageInstruction(responseLanguage)}`,
    user: testStimulusUserPromptWithScorecard(estimulo, hasAttachments, scorecardCriteria),
    schema: testResponseSchema,
    shapeHint: TEST_RESPONSE_SHAPE_HINT,
    imageDataUri,
    attachments
  })
  return { ...result, scorecardScores: result.scorecardScores ?? {} }
}

export async function getPersonaChatReply(
  call: ProviderCall,
  persona: Persona,
  historia: ChatMensaje[],
  mensajeNuevo: string,
  responseLanguage: ResponseLanguage = 'es'
): Promise<string> {
  if (call.provider === 'local') {
    return chatReplyLocal(persona, historia, mensajeNuevo)
  }
  const result = await providerRegistry[call.provider].chatJson({
    apiKey: call.apiKey,
    model: call.model,
    system: `${personaSystemPrompt(persona)} ${responseLanguageInstruction(responseLanguage)}`,
    user: chatUserPrompt(historia, mensajeNuevo),
    schema: chatReplySchema,
    shapeHint: CHAT_REPLY_SHAPE_HINT
  })
  return result.respuesta
}

export async function getFollowUpReply(
  call: ProviderCall,
  persona: Persona,
  opinionOriginal: string,
  pregunta: string,
  responseLanguage: ResponseLanguage = 'es'
): Promise<string> {
  if (call.provider === 'local') {
    return followUpReplyLocal(persona, opinionOriginal, pregunta)
  }
  const result = await providerRegistry[call.provider].chatJson({
    apiKey: call.apiKey,
    model: call.model,
    system: `${personaSystemPrompt(persona)} ${responseLanguageInstruction(responseLanguage)}`,
    user: followUpUserPrompt(opinionOriginal, pregunta),
    schema: chatReplySchema,
    shapeHint: CHAT_REPLY_SHAPE_HINT
  })
  return result.respuesta
}

export async function getFunnelStageResponse(
  call: ProviderCall,
  persona: Persona,
  etapa: EtapaFunnel,
  historialPropio: EtapaPropiaHistorial[],
  peerSummary?: string,
  scorecardCriteria: string[] = [],
  responseLanguage: ResponseLanguage = 'es'
): Promise<LocalFunnelRespuesta> {
  const attachments = etapa.estimuloMetadata.attachments ?? []
  if (call.provider === 'local') {
    return funnelStageResponseLocal(persona, etapa, historialPropio, peerSummary, scorecardCriteria)
  }
  const result = await providerRegistry[call.provider].chatJson({
    apiKey: call.apiKey,
    model: call.model,
    system: `${personaSystemPrompt(persona)} ${responseLanguageInstruction(responseLanguage)}`,
    user: funnelStageUserPromptWithScorecard(etapa, historialPropio, peerSummary, scorecardCriteria),
    schema: funnelStageResponseSchema,
    shapeHint: FUNNEL_STAGE_RESPONSE_SHAPE_HINT,
    imageDataUri: etapa.estimuloMetadata.imagenDataUri,
    attachments
  })
  return { ...result, scorecardScores: result.scorecardScores ?? {} }
}

export async function getConfidenceDisclaimersQualitative(call: ProviderCall, respuestas: RespuestaConPersona[]): Promise<string[]> {
  if (respuestas.length === 0) return []
  if (call.provider === 'local') {
    return confidenceDisclaimerLocal(respuestas)
  }
  const result = await providerRegistry[call.provider].chatJson({
    apiKey: call.apiKey,
    model: call.model,
    system: confidenceDisclaimersSystemPrompt(),
    user: confidenceDisclaimersUserPrompt(respuestas),
    schema: confidenceDisclaimersSchema,
    shapeHint: CONFIDENCE_DISCLAIMERS_SHAPE_HINT
  })
  return result.disclaimers
}

export async function generarResumenEjecutivo(call: ProviderCall, estimulo: string, respuestas: RespuestaConPersona[]): Promise<string> {
  if (respuestas.length === 0) return ''
  if (call.provider === 'local') {
    return resumenEjecutivoLocal(respuestas)
  }
  const result = await providerRegistry[call.provider].chatJson({
    apiKey: call.apiKey,
    model: call.model,
    system: resumenEjecutivoSystemPrompt(),
    user: resumenEjecutivoUserPrompt(estimulo, respuestas),
    schema: resumenEjecutivoSchema,
    shapeHint: RESUMEN_EJECUTIVO_SHAPE_HINT
  })
  return result.resumen
}

export async function extraerTemasConIa(call: ProviderCall, respuestas: RespuestaConPersona[]): Promise<LocalTema[]> {
  if (respuestas.length === 0) return []
  if (call.provider === 'local') {
    return temasExtractorLocal(respuestas)
  }
  const result = await providerRegistry[call.provider].chatJson({
    apiKey: call.apiKey,
    model: call.model,
    system: temasSystemPrompt(),
    user: temasUserPrompt(respuestas),
    schema: temasExtraccionSchema,
    shapeHint: TEMAS_EXTRACCION_SHAPE_HINT
  })
  const validIds = new Set(respuestas.map((r) => r.personaId))
  return result.temas
    .map((t) => ({ ...t, representativas: t.representativas.filter((rep) => validIds.has(rep.personaId)) }))
    .filter((t) => t.representativas.length > 0)
}
