import { z } from 'zod'

export const personaDraftSchema = z.object({
  nombre: z.string().min(1),
  edad: z.number().int().min(16).max(95),
  genero: z.string().min(1),
  ciudad: z.string().min(1),
  pais: z.string().min(1),
  ocupacion: z.string().min(1),
  nivelIngreso: z.enum(['bajo', 'medio', 'alto']),
  nivelEducativo: z.string().min(1),
  estadoCivil: z.string().min(1),
  disposicionBase: z.enum(['entusiasta', 'neutro', 'esceptico', 'hostil']),
  rasgos: z.array(z.string()).min(1).max(6),
  valores: z.array(z.string()).min(1).max(6),
  historiaPersonal: z.string().min(1),
  objecionesTipicas: z.array(z.string()).min(0).max(6),
  canalPreferido: z.string().min(1)
})

export const personaGenSchema = z.object({
  personas: z.array(personaDraftSchema).min(1)
})

export type PersonaGenResult = z.infer<typeof personaGenSchema>

export const personaImproveSchema = z.object({
  persona: personaDraftSchema
})

export type PersonaImproveResult = z.infer<typeof personaImproveSchema>

export const testResponseSchema = z.object({
  scoreSatisfaccion: z.number().int().min(1).max(10),
  scorecardScores: z.record(z.number().int().min(1).max(10)).optional().default({}),
  opinionTexto: z.string().min(1),
  objeciones: z.array(z.string()).max(6),
  aspectosPositivos: z.array(z.string()).max(6)
})

export type TestResponseResult = z.infer<typeof testResponseSchema>

export const funnelStageResponseSchema = testResponseSchema.extend({
  avanzoASiguienteEtapa: z.boolean()
})

export type FunnelStageResponseResult = z.infer<typeof funnelStageResponseSchema>

export const chatReplySchema = z.object({
  respuesta: z.string().min(1)
})

export type ChatReplyResult = z.infer<typeof chatReplySchema>

export const PERSONA_GEN_SHAPE_HINT = `{
  "personas": [
    {
      "nombre": "string", "edad": number, "genero": "string", "ciudad": "string", "pais": "string",
      "ocupacion": "string", "nivelIngreso": "bajo"|"medio"|"alto", "nivelEducativo": "string",
      "estadoCivil": "string", "disposicionBase": "entusiasta"|"neutro"|"esceptico"|"hostil",
      "rasgos": ["string", ...], "valores": ["string", ...], "historiaPersonal": "string",
      "objecionesTipicas": ["string", ...], "canalPreferido": "string"
    }
  ]
}`

export const PERSONA_IMPROVE_SHAPE_HINT = `{
  "persona": {
    "nombre": "string", "edad": number, "genero": "string", "ciudad": "string", "pais": "string",
    "ocupacion": "string", "nivelIngreso": "bajo"|"medio"|"alto", "nivelEducativo": "string",
    "estadoCivil": "string", "disposicionBase": "entusiasta"|"neutro"|"esceptico"|"hostil",
    "rasgos": ["string", ...], "valores": ["string", ...], "historiaPersonal": "string",
    "objecionesTipicas": ["string", ...], "canalPreferido": "string"
  }
}`

export const TEST_RESPONSE_SHAPE_HINT = `{
  "scoreSatisfaccion": number (1-10), "opinionTexto": "string",
  "scorecardScores": { "criterio": number (1-10), ... },
  "objeciones": ["string", ...], "aspectosPositivos": ["string", ...]
}`

export const FUNNEL_STAGE_RESPONSE_SHAPE_HINT = `{
  "scoreSatisfaccion": number (1-10), "opinionTexto": "string",
  "scorecardScores": { "criterio": number (1-10), ... },
  "objeciones": ["string", ...], "aspectosPositivos": ["string", ...],
  "avanzoASiguienteEtapa": boolean (¿seguirías al siguiente paso o abandonarías aquí?)
}`

export const CHAT_REPLY_SHAPE_HINT = `{ "respuesta": "string" }`

export const confidenceDisclaimersSchema = z.object({
  disclaimers: z.array(z.string().min(1)).min(0).max(2)
})

export type ConfidenceDisclaimersResult = z.infer<typeof confidenceDisclaimersSchema>

export const CONFIDENCE_DISCLAIMERS_SHAPE_HINT = `{ "disclaimers": ["string", ...] }`

export const resumenEjecutivoSchema = z.object({
  resumen: z.string().min(1)
})

export type ResumenEjecutivoResult = z.infer<typeof resumenEjecutivoSchema>

export const RESUMEN_EJECUTIVO_SHAPE_HINT = `{ "resumen": "string" }`

export const temasExtraccionSchema = z.object({
  temas: z
    .array(
      z.object({
        nombre: z.string().min(1),
        cantidadMenciones: z.number().int().min(1),
        representativas: z
          .array(z.object({ personaId: z.string().min(1), quote: z.string().min(1) }))
          .min(1)
          .max(2)
      })
    )
    .min(1)
    .max(5)
})

export type TemasExtraccionResult = z.infer<typeof temasExtraccionSchema>

export const TEMAS_EXTRACCION_SHAPE_HINT = `{
  "temas": [
    { "nombre": "string", "cantidadMenciones": number, "representativas": [{ "personaId": "string (uno de los IDs dados)", "quote": "string, copiado o casi textual de la opinión real de esa persona" }] }
  ]
}`
