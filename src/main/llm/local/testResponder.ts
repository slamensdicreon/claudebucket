import { hashSeed, mulberry32, pickFrom, pickMany, randomInt } from '../seededRandom'
import type { Persona } from '@shared/types'

const DISPOSICION_BASE_SCORE: Record<Persona['disposicionBase'], number> = {
  entusiasta: 8,
  neutro: 6,
  esceptico: 4,
  hostil: 2
}

const APERTURAS_POSITIVAS = [
  'Me llama la atención',
  'Suena interesante',
  'Podría considerarlo',
  'Me convence bastante'
]

const APERTURAS_NEGATIVAS = [
  'No me termina de convencer',
  'Tengo mis dudas',
  'No es lo mío, la verdad',
  'Me cuesta ver el valor'
]

const ASPECTOS_POSITIVOS_POOL = [
  'la propuesta se siente clara',
  'el mensaje conecta con lo que busco',
  'parece resolver un problema real',
  'el tono me genera confianza',
  'se ve fácil de entender'
]

export interface LocalRespuesta {
  scoreSatisfaccion: number
  scorecardScores: Record<string, number>
  opinionTexto: string
  objeciones: string[]
  aspectosPositivos: string[]
}

export function respondToStimulusLocal(persona: Persona, estimulo: string, tieneImagen = false, scorecardCriteria: string[] = []): LocalRespuesta {
  const seed = hashSeed(`${persona.id}::${estimulo}::${tieneImagen}`)
  const rng = mulberry32(seed)

  const base = DISPOSICION_BASE_SCORE[persona.disposicionBase]
  const jitter = randomInt(rng, -2, 2)
  const scoreSatisfaccion = Math.min(10, Math.max(1, base + jitter))

  const esPositivo = scoreSatisfaccion >= 6
  const apertura = pickFrom(rng, esPositivo ? APERTURAS_POSITIVAS : APERTURAS_NEGATIVAS)
  const objeciones = esPositivo ? pickMany(rng, persona.objecionesTipicas, 1) : pickMany(rng, persona.objecionesTipicas, 2)
  const aspectosPositivos = esPositivo ? pickMany(rng, ASPECTOS_POSITIVOS_POOL, 2) : pickMany(rng, ASPECTOS_POSITIVOS_POOL, 1)

  const opinionTexto = `${apertura}${tieneImagen ? ', visualmente,' : ''}. Como ${persona.ocupacion} en ${persona.ciudad}, ${
    esPositivo ? 'valoro' : 'me preocupa'
  } ${aspectosPositivos[0] ?? 'la propuesta'}${objeciones.length ? `, aunque ${objeciones[0]}` : ''}.`

  const scorecardScores = Object.fromEntries(
    scorecardCriteria.map((criterio, idx) => {
      const delta = randomInt(mulberry32(hashSeed(`${persona.id}::${estimulo}::${criterio}::${idx}`)), -1, 1)
      return [criterio, Math.min(10, Math.max(1, scoreSatisfaccion + delta))]
    })
  )

  return { scoreSatisfaccion, scorecardScores, opinionTexto, objeciones, aspectosPositivos }
}
