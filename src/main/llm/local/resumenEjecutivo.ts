import type { RespuestaConPersona } from '@shared/types'
import { sentimentBucket } from '@shared/types'

export function resumenEjecutivoLocal(respuestas: RespuestaConPersona[]): string {
  if (respuestas.length === 0) return 'No hubo respuestas suficientes para generar un resumen.'

  const scorePromedio = respuestas.reduce((a, r) => a + r.scoreSatisfaccion, 0) / respuestas.length
  const buckets = { positivo: 0, neutro: 0, negativo: 0 }
  for (const r of respuestas) buckets[sentimentBucket(r.scoreSatisfaccion)]++

  const dominante = (Object.entries(buckets) as Array<[keyof typeof buckets, number]>).sort((a, b) => b[1] - a[1])[0][0]
  const objecionesFrecuentes = respuestas.flatMap((r) => r.objeciones)
  const objecionTop = objecionesFrecuentes[0]

  const recepcion =
    dominante === 'positivo' ? 'fue recibido de forma mayormente positiva' : dominante === 'negativo' ? 'tuvo una recepción mayormente negativa' : 'tuvo una recepción mixta'

  let texto = `El estímulo ${recepcion} entre el panel (score promedio ${scorePromedio.toFixed(1)}/10).`
  if (objecionTop) {
    texto += ` La objeción más mencionada fue: "${objecionTop}".`
  }
  texto += ' Revisa las respuestas individuales para matices por segmento antes de tomar decisiones.'
  return texto
}
