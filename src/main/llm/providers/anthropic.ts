import type { ChatJsonArgs, LlmProvider } from '../types'
import { hasUnsupportedFiles, LlmError, normalizeAttachments, parseDataUri } from '../types'
import { withJsonRetry } from '../jsonRetry'
import { fetchWithBackoff } from '../fetchWithBackoff'

const ENDPOINT = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'

export const anthropicProvider: LlmProvider = {
  id: 'anthropic',
  async chatJson<T>(args: ChatJsonArgs<T>): Promise<T> {
    if (!args.apiKey) throw new LlmError('Falta la API key de Anthropic.', 'anthropic')

    return withJsonRetry('anthropic', args.schema, async (correction) => {
      const userText = correction ? `${args.user}\n\n${correction}` : args.user
      const attachments = normalizeAttachments(args)
      if (hasUnsupportedFiles('anthropic', attachments)) {
        throw new LlmError('Anthropic en Crowdmind solo acepta imagenes como adjuntos. Usa OpenAI para analizar PDFs o archivos.', 'anthropic')
      }
      const userContent =
        attachments.length > 0
          ? [
              ...attachments.map((attachment) => {
                const { mimeType, base64 } = parseDataUri(attachment.dataUri)
                return { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } }
              }),
              { type: 'text', text: userText }
            ]
          : userText
      const res = await fetchWithBackoff(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': args.apiKey!,
          'anthropic-version': ANTHROPIC_VERSION
        },
        body: JSON.stringify({
          model: args.model,
          max_tokens: 2048,
          temperature: 0.9,
          system: `${args.system}\n\nResponde EXCLUSIVAMENTE con JSON válido, sin texto adicional ni markdown, con esta forma:\n${args.shapeHint}`,
          messages: [{ role: 'user', content: userContent }]
        })
      })
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new LlmError(`Anthropic respondió ${res.status}: ${body.slice(0, 300)}`, 'anthropic')
      }
      const data = (await res.json()) as any
      const block = data?.content?.find((c: { type: string }) => c.type === 'text')
      if (!block || typeof block.text !== 'string') throw new LlmError('Anthropic no devolvió contenido de texto.', 'anthropic')
      return block.text
    })
  }
}
