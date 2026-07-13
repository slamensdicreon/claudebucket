import type { ChatJsonArgs, LlmProvider } from '../types'
import { LlmError, hasUnsupportedFiles, normalizeAttachments } from '../types'
import { withJsonRetry } from '../jsonRetry'
import { fetchWithBackoff } from '../fetchWithBackoff'

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'

export const openrouterProvider: LlmProvider = {
  id: 'openrouter',
  async chatJson<T>(args: ChatJsonArgs<T>): Promise<T> {
    if (!args.apiKey) throw new LlmError('Falta la API key de OpenRouter.', 'openrouter')

    return withJsonRetry('openrouter', args.schema, async (correction) => {
      const userText = correction ? `${args.user}\n\n${correction}` : args.user
      const attachments = normalizeAttachments(args)
      if (hasUnsupportedFiles('openrouter', attachments)) {
        throw new LlmError('OpenRouter en Crowdmind solo acepta imagenes como adjuntos. Usa OpenAI para analizar PDFs o archivos.', 'openrouter')
      }
      const userContent =
        attachments.length > 0
          ? [
              { type: 'text', text: userText },
              ...attachments.map((attachment) => ({ type: 'image_url', image_url: { url: attachment.dataUri } }))
            ]
          : userText
      const res = await fetchWithBackoff(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${args.apiKey}`,
          'HTTP-Referer': 'https://github.com/Brokenwatch24/crowdmind',
          'X-Title': 'Crowdmind'
        },
        body: JSON.stringify({
          model: args.model,
          temperature: 0.9,
          messages: [
            {
              role: 'system',
              content: `${args.system}\n\nResponde EXCLUSIVAMENTE con JSON válido, sin texto adicional ni markdown, con esta forma:\n${args.shapeHint}`
            },
            { role: 'user', content: userContent }
          ]
        })
      })
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new LlmError(`OpenRouter respondió ${res.status}: ${body.slice(0, 300)}`, 'openrouter')
      }
      const data = (await res.json()) as any
      const content = data?.choices?.[0]?.message?.content
      if (typeof content !== 'string') throw new LlmError('OpenRouter no devolvió contenido de texto.', 'openrouter')
      return content
    })
  }
}
