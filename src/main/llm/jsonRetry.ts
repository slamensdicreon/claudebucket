import type { ZodType } from 'zod'
import type { ProviderId } from '@shared/types'
import { extractJsonBlock, LlmError } from './types'

/**
 * Calls `rawChat` (a closure that performs one provider request) up to twice: once normally,
 * and once more with an added correction instruction if the first response wasn't valid JSON
 * matching `schema`. Keeps every provider's retry behavior identical.
 */
export async function withJsonRetry<T>(
  providerId: ProviderId,
  schema: ZodType<T>,
  rawChat: (correction?: string) => Promise<string>
): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const correction =
        attempt === 0
          ? undefined
          : 'Tu respuesta anterior no era JSON válido según el formato pedido. Devuelve EXCLUSIVAMENTE JSON válido, sin texto adicional, sin markdown.'
      const text = await rawChat(correction)
      const jsonText = extractJsonBlock(text)
      const parsed: unknown = JSON.parse(jsonText)
      return schema.parse(parsed)
    } catch (err) {
      lastError = err
    }
  }
  throw new LlmError(`No se pudo obtener una respuesta JSON válida del proveedor tras 2 intentos.`, providerId, lastError)
}
