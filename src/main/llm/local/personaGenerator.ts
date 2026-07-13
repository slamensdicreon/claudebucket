import { hashSeed, mulberry32, pickFrom, pickMany, randomInt } from '../seededRandom'
import * as pools from './pools'
import type { PersonaDraft, DisposicionBase, NivelIngreso } from '@shared/types'
import { DISPOSICIONES, NIVELES_INGRESO } from '@shared/types'

/**
 * Deterministic offline persona generator used by the "Local (sin conexión)" provider.
 * Same brief + index always produces the same persona, so runs are reproducible without any API key.
 */
export function generatePersonasLocal(brief: string, count: number): PersonaDraft[] {
  const drafts: PersonaDraft[] = []
  for (let i = 0; i < count; i++) {
    const seed = hashSeed(`${brief}::${i}`)
    const rng = mulberry32(seed)

    const nombre = `${pickFrom(rng, pools.NOMBRES)} ${pickFrom(rng, pools.APELLIDOS)}`
    const { ciudad, pais } = pickFrom(rng, pools.CIUDADES)
    const ocupacion = pickFrom(rng, pools.OCUPACIONES)
    const disposicionBase: DisposicionBase = pickFrom(rng, DISPOSICIONES)
    const nivelIngreso: NivelIngreso = pickFrom(rng, NIVELES_INGRESO)
    const historia = pickFrom(rng, pools.HISTORIA_TEMPLATES)(nombre, ocupacion, ciudad)

    drafts.push({
      nombre,
      edad: randomInt(rng, 21, 62),
      genero: pickFrom(rng, pools.GENEROS),
      ciudad,
      pais,
      ocupacion,
      nivelIngreso,
      nivelEducativo: pickFrom(rng, pools.NIVELES_EDUCATIVOS),
      estadoCivil: pickFrom(rng, pools.ESTADOS_CIVILES),
      disposicionBase,
      rasgos: pickMany(rng, pools.RASGOS, 3),
      valores: pickMany(rng, pools.VALORES, 3),
      historiaPersonal: historia,
      objecionesTipicas: pickMany(rng, pools.OBJECIONES_TIPICAS, 2),
      canalPreferido: pickFrom(rng, pools.CANALES),
      llmProviderOverride: null,
      llmModelOverride: null
    })
  }
  return drafts
}
