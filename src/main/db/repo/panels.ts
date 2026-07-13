import { eq, sql } from 'drizzle-orm'
import { getDb } from '../client'
import { paneles, personas, tests, respuestas } from '../schema'
import { newId, now } from '../ids'
import type { Panel } from '@shared/types'
import { deleteNotesForScope } from './notes'

function toPanel(row: typeof paneles.$inferSelect, personaCount = 0): Panel {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    nombre: row.nombre,
    descripcion: row.descripcion,
    color: row.color,
    esPublico: row.esPublico,
    descripcionPublica: row.descripcionPublica,
    autorPublico: row.autorPublico,
    createdAt: row.createdAt,
    personaCount
  }
}

export function listPanels(workspaceId: string): Panel[] {
  const rows = getDb().select().from(paneles).where(eq(paneles.workspaceId, workspaceId)).all()
  const counts = getDb()
    .select({ panelId: personas.panelId, count: sql<number>`count(*)` })
    .from(personas)
    .groupBy(personas.panelId)
    .all()
  const countMap = new Map(counts.map((c) => [c.panelId, c.count]))
  return rows
    .map((r) => toPanel(r, countMap.get(r.id) ?? 0))
    .sort((a, b) => b.createdAt - a.createdAt)
}

export function getPanel(id: string): Panel | null {
  const row = getDb().select().from(paneles).where(eq(paneles.id, id)).get()
  if (!row) return null
  const count = getDb().select({ n: sql<number>`count(*)` }).from(personas).where(eq(personas.panelId, id)).get()
  return toPanel(row, count?.n ?? 0)
}

export function createPanel(input: { workspaceId: string; nombre: string; descripcion: string; color: string }): Panel {
  const row = {
    id: newId(),
    workspaceId: input.workspaceId,
    nombre: input.nombre.trim() || 'Nuevo panel',
    descripcion: input.descripcion ?? '',
    color: input.color,
    esPublico: false,
    descripcionPublica: null,
    autorPublico: null,
    createdAt: now()
  }
  getDb().insert(paneles).values(row).run()
  return toPanel(row, 0)
}

export function updatePanel(
  id: string,
  input: Partial<{ nombre: string; descripcion: string; color: string; esPublico: boolean; descripcionPublica: string; autorPublico: string }>
): Panel {
  getDb().update(paneles).set(input).where(eq(paneles.id, id)).run()
  const p = getPanel(id)
  if (!p) throw new Error('Panel no encontrado')
  return p
}

export function deletePanel(id: string): void {
  const panelTests = getDb().select().from(tests).where(eq(tests.panelId, id)).all()
  for (const test of panelTests) {
    getDb().delete(respuestas).where(eq(respuestas.testId, test.id)).run()
    deleteNotesForScope('test', test.id)
  }
  getDb().delete(tests).where(eq(tests.panelId, id)).run()
  getDb().delete(personas).where(eq(personas.panelId, id)).run()
  deleteNotesForScope('panel', id)
  getDb().delete(paneles).where(eq(paneles.id, id)).run()
}
