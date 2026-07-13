import type { RespuestaConPersona } from '@shared/types'

export interface LocalTema {
  nombre: string
  cantidadMenciones: number
  representativas: Array<{ personaId: string; quote: string }>
}

/** Groups repeated aspectosPositivos/objeciones phrases across respuestas — no AI, just frequency counting. */
export function temasExtractorLocal(respuestas: RespuestaConPersona[]): LocalTema[] {
  const byKey = new Map<string, { label: string; count: number; representativas: Array<{ personaId: string; quote: string }> }>()

  for (const r of respuestas) {
    for (const phrase of [...r.aspectosPositivos, ...r.objeciones]) {
      const key = phrase.trim().toLowerCase()
      if (!key) continue
      const entry = byKey.get(key) ?? { label: phrase, count: 0, representativas: [] }
      entry.count++
      if (entry.representativas.length < 2 && !entry.representativas.some((p) => p.personaId === r.personaId)) {
        entry.representativas.push({ personaId: r.personaId, quote: r.opinionTexto.slice(0, 140) })
      }
      byKey.set(key, entry)
    }
  }

  return [...byKey.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((e) => ({ nombre: e.label, cantidadMenciones: e.count, representativas: e.representativas }))
}
