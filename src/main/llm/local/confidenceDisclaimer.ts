import type { RespuestaConPersona } from '@shared/types'

/** Deterministic, rule-derived qualitative disclaimer for the "local" provider — inspects the actual gap. */
export function confidenceDisclaimerLocal(respuestas: RespuestaConPersona[]): string[] {
  if (respuestas.length === 0) return []

  const edades = respuestas.map((r) => r.persona.edad)
  const maxEdad = Math.max(...edades)
  const minEdad = Math.min(...edades)
  const ingresos = new Set(respuestas.map((r) => r.persona.nivelIngreso))

  const notas: string[] = []
  if (maxEdad < 50) {
    notas.push(`El panel no incluye personas mayores de ${maxEdad} años — considera esto si tu producto también apunta a ese segmento.`)
  }
  if (minEdad > 25) {
    notas.push(`El panel no incluye personas menores de ${minEdad} años.`)
  }
  if (ingresos.size === 1) {
    notas.push(`Todas las personas del panel tienen nivel de ingreso "${[...ingresos][0]}" — no hay contraste de poder adquisitivo en esta muestra.`)
  }
  return notas.slice(0, 2)
}
