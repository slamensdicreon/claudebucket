import { listTests, listRespuestasForTest } from './tests'
import type { PanelTimelinePoint } from '@shared/types'

export function getPanelTimeline(panelId: string): PanelTimelinePoint[] {
  const tests = listTests(panelId)
  return tests
    .map((test) => {
      const respuestas = listRespuestasForTest(test.id)
      const scorePromedio = respuestas.length ? respuestas.reduce((a, r) => a + r.scoreSatisfaccion, 0) / respuestas.length : 0
      return {
        testId: test.id,
        nombre: test.nombre,
        tipo: test.tipo,
        estimuloContenido: test.estimuloContenido,
        scorePromedio,
        createdAt: test.createdAt
      }
    })
    .sort((a, b) => a.createdAt - b.createdAt)
}
