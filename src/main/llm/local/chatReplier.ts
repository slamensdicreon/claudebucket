import { hashSeed, mulberry32, pickFrom } from '../seededRandom'
import type { ChatMensaje, Persona } from '@shared/types'

const CONECTORES = [
  'Mirándolo desde mi día a día,',
  'Honestamente,',
  'Pensándolo bien,',
  'Desde mi experiencia,'
]

export function chatReplyLocal(persona: Persona, historia: ChatMensaje[], mensajeNuevo: string): string {
  const seed = hashSeed(`${persona.id}::${historia.length}::${mensajeNuevo}`)
  const rng = mulberry32(seed)
  const conector = pickFrom(rng, CONECTORES)
  const rasgo = persona.rasgos[Math.floor(rng() * persona.rasgos.length)] ?? persona.disposicionBase
  const valor = persona.valores[Math.floor(rng() * persona.valores.length)] ?? 'lo práctico'

  return `${conector} como alguien ${rasgo} y que valora ${valor}, sobre "${mensajeNuevo.slice(0, 80)}" diría que ${
    persona.disposicionBase === 'entusiasta' || persona.disposicionBase === 'neutro'
      ? 'me parece razonable, aunque depende de los detalles concretos.'
      : 'necesitaría más pruebas antes de convencerme del todo.'
  }`
}
