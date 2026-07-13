import type { ZodType } from 'zod'
import type { EstimuloAttachment, ProviderId } from '@shared/types'

export type LlmAttachment = Pick<EstimuloAttachment, 'type' | 'name' | 'mimeType' | 'dataUri' | 'sizeBytes'>

export interface ChatJsonArgs<T> {
  apiKey: string | null
  model: string
  system: string
  user: string
  schema: ZodType<T>
  /** Human-readable example/description of the expected JSON shape, embedded in the prompt. */
  shapeHint: string
  /** Optional stimulus image as a data: URI (base64) — sent as a vision attachment when present. */
  imageDataUri?: string
  attachments?: LlmAttachment[]
}

export interface ParsedDataUri {
  mimeType: string
  base64: string
}

/** Splits a `data:<mime>;base64,<data>` URI into its parts. Throws on anything else — we only ever produce these ourselves. */
export function parseDataUri(dataUri: string): ParsedDataUri {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUri)
  if (!match) throw new Error('Formato de imagen inválido — se esperaba un data URI base64.')
  return { mimeType: match[1], base64: match[2] }
}

export function normalizeAttachments(args: { imageDataUri?: string; attachments?: LlmAttachment[] }): LlmAttachment[] {
  const attachments = [...(args.attachments ?? [])]
  if (args.imageDataUri && !attachments.some((a) => a.dataUri === args.imageDataUri)) {
    attachments.unshift({
      type: 'image',
      name: 'stimulus-image',
      mimeType: 'image/png',
      dataUri: args.imageDataUri,
      sizeBytes: 0
    })
  }
  return attachments
}

export function hasUnsupportedFiles(provider: ProviderId, attachments: LlmAttachment[]): boolean {
  if (provider === 'openai' || provider === 'local') return false
  return attachments.some((attachment) => attachment.type !== 'image')
}

export interface LlmProvider {
  id: ProviderId
  chatJson<T>(args: ChatJsonArgs<T>): Promise<T>
}

export class LlmError extends Error {
  constructor(
    message: string,
    public readonly provider: ProviderId,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'LlmError'
  }
}

export function extractJsonBlock(text: string): string {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced) return fenced[1].trim()
  const firstBrace = trimmed.indexOf('{')
  const firstBracket = trimmed.indexOf('[')
  const starts = [firstBrace, firstBracket].filter((i) => i !== -1)
  if (starts.length === 0) return trimmed
  const start = Math.min(...starts)
  const isArray = trimmed[start] === '['
  const end = isArray ? trimmed.lastIndexOf(']') : trimmed.lastIndexOf('}')
  if (end === -1 || end < start) return trimmed
  return trimmed.slice(start, end + 1)
}
