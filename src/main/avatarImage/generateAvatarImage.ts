import type { Persona } from '@shared/types'
import { fetchWithBackoff } from '../llm/fetchWithBackoff'
import { LlmError } from '../llm/types'

const ENDPOINT = 'https://api.openai.com/v1/images/generations'
const MODEL = 'gpt-image-1'

function buildAvatarPrompt(persona: Persona): string {
  return [
    `Professional portrait photo of a fictional person: ${persona.genero}, ${persona.edad} years old,`,
    `${persona.ocupacion}, living in ${persona.ciudad}, ${persona.pais}.`,
    'Realistic photography style, neutral studio background, natural expression, shoulders-up framing,',
    'soft even lighting. No text, no watermark, no logos.'
  ].join(' ')
}

/** Generates a portrait photo for a persona via OpenAI's image API and returns it as a data: URI (PNG). */
export async function generatePersonaAvatarImage(persona: Persona, apiKey: string | null): Promise<string> {
  if (!apiKey) throw new LlmError('Falta la API key de OpenAI — configúrala en Ajustes para generar imágenes.', 'openai')

  const res = await fetchWithBackoff(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: MODEL,
      prompt: buildAvatarPrompt(persona),
      size: '1024x1024',
      n: 1
    })
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new LlmError(`OpenAI (imágenes) respondió ${res.status}: ${body.slice(0, 300)}`, 'openai')
  }

  const data = (await res.json()) as any
  const item = data?.data?.[0]

  if (item?.b64_json) {
    return `data:image/png;base64,${item.b64_json}`
  }
  if (item?.url) {
    const imgRes = await fetch(item.url)
    const buffer = Buffer.from(await imgRes.arrayBuffer())
    return `data:image/png;base64,${buffer.toString('base64')}`
  }
  throw new LlmError('OpenAI no devolvió una imagen utilizable.', 'openai')
}
