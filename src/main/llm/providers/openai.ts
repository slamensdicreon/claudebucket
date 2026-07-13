import type { ChatJsonArgs, LlmProvider } from '../types'
import { LlmError, normalizeAttachments } from '../types'
import { withJsonRetry } from '../jsonRetry'
import { fetchWithBackoff } from '../fetchWithBackoff'

const ENDPOINT = 'https://api.openai.com/v1/chat/completions'

export const openaiProvider: LlmProvider = {
  id: 'openai',
  async chatJson<T>(args: ChatJsonArgs<T>): Promise<T> {
    if (!args.apiKey) throw new LlmError('Falta la API key de OpenAI.', 'openai')

    return withJsonRetry('openai', args.schema, async (correction) => {
      const userText = correction ? `${args.user}\n\n${correction}` : args.user
      const attachments = normalizeAttachments(args)
      const userContent =
        attachments.length > 0
          ? [
              { type: 'text', text: userText },
              ...attachments.map((attachment) =>
                attachment.type === 'image'
                  ? { type: 'image_url', image_url: { url: attachment.dataUri } }
                  : { type: 'file', file: { filename: attachment.name, file_data: attachment.dataUri } }
              )
            ]
          : userText
      const res = await fetchWithBackoff(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${args.apiKey}`
        },
        body: JSON.stringify({
          model: args.model,
          temperature: 0.9,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `${args.system}\n\nResponde EXCLUSIVAMENTE con JSON válido con esta forma:\n${args.shapeHint}`
            },
            { role: 'user', content: userContent }
          ]
        })
      })
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new LlmError(`OpenAI respondió ${res.status}: ${body.slice(0, 300)}`, 'openai')
      }
      const data = (await res.json()) as any
      const content = data?.choices?.[0]?.message?.content
      if (typeof content !== 'string') throw new LlmError('OpenAI no devolvió contenido de texto.', 'openai')
      return content
    })
  }
}
