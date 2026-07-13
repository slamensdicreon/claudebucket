import { hashSeed, mulberry32, pickFrom } from '../seededRandom'
import type { Persona } from '@shared/types'

const CONECTORES = ['Pensándolo de nuevo,', 'Si me lo preguntas así,', 'La verdad es que,', 'Reflexionando un poco más,']

export function followUpReplyLocal(persona: Persona, opinionOriginal: string, pregunta: string): string {
  const seed = hashSeed(`${persona.id}::followup::${pregunta}`)
  const rng = mulberry32(seed)
  const conector = pickFrom(rng, CONECTORES)
  const valor = persona.valores[Math.floor(rng() * persona.valores.length)] ?? 'lo práctico'

  return `${conector} manteniendo lo que dije antes ("${opinionOriginal.slice(0, 60)}..."), sobre "${pregunta.slice(0, 60)}" te diría que depende sobre todo de ${valor} — eso es lo que más pesa en mi decisión.`
}
