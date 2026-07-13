import type { ChatJsonArgs, LlmProvider } from '../types'
import { hasUnsupportedFiles, LlmError, normalizeAttachments, parseDataUri } from '../types'
import { withJsonRetry } from '../jsonRetry'
import { fetchWithBackoff } from '../fetchWithBackoff'

export const geminiProvider: LlmProvider = {
  id: 'gemini',
  async chatJson<T>(args: ChatJsonArgs<T>): Promise<T> {
    if (!args.apiKey) throw new LlmError('Falta la API key de Gemini.', 'gemini')

    return withJsonRetry('gemini', args.schema, async (correction) => {
      const userText = correction ? `${args.user}\n\n${correction}` : args.user
      const attachments = normalizeAttachments(args)
      if (hasUnsupportedFiles('gemini', attachments)) {
        throw new LlmError('Gemini en Crowdmind solo acepta imagenes como adjuntos. Usa OpenAI para analizar PDFs o archivos.', 'gemini')
      }
      const parts: unknown[] = []
      for (const attachment of attachments) {
        const { mimeType, base64 } = parseDataUri(attachment.dataUri)
        parts.push({ inlineData: { mimeType, data: base64 } })
      }
      parts.push({ text: userText })

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        args.model
      )}:generateContent?key=${args.apiKey}`
      const res = await fetchWithBackoff(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: `${args.system}\n\nResponde EXCLUSIVAMENTE con JSON válido con esta forma:\n${args.shapeHint}` }]
          },
          contents: [{ role: 'user', parts }],
          generationConfig: { temperature: 0.9, responseMimeType: 'application/json' }
        })
      })
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new LlmError(`Gemini respondió ${res.status}: ${body.slice(0, 300)}`, 'gemini')
      }
      const data = (await res.json()) as any
      const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('')
      if (typeof text !== 'string' || !text) throw new LlmError('Gemini no devolvió contenido de texto.', 'gemini')
      return text
    })
  }
}
