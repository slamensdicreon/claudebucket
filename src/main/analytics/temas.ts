import type { RespuestaConPersona, TemaTest } from '@shared/types'
import { extraerTemasConIa, type ProviderCall } from '../llm/useCases'
import { saveTemas } from '../db/repo/temas'

export async function extraerYGuardarTemas(testId: string, call: ProviderCall, respuestas: RespuestaConPersona[]): Promise<TemaTest[]> {
  try {
    const temas = await extraerTemasConIa(call, respuestas)
    return saveTemas(testId, temas)
  } catch {
    // Theme extraction is a nice-to-have — never fail the whole test run if this call errors.
    return []
  }
}
