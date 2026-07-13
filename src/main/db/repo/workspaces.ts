import { eq } from 'drizzle-orm'
import { getDb } from '../client'
import { workspaces } from '../schema'
import { newId, now } from '../ids'
import type { Workspace } from '@shared/types'
import { listPanels, deletePanel } from './panels'
import { deleteNotesForScope } from './notes'

function toWorkspace(row: typeof workspaces.$inferSelect): Workspace {
  return { id: row.id, nombre: row.nombre, createdAt: row.createdAt }
}

export function listWorkspaces(): Workspace[] {
  const rows = getDb().select().from(workspaces).all()
  return rows.map(toWorkspace).sort((a, b) => a.createdAt - b.createdAt)
}

export function createWorkspace(nombre: string): Workspace {
  const row = { id: newId(), nombre: nombre.trim() || 'Nuevo workspace', createdAt: now() }
  getDb().insert(workspaces).values(row).run()
  return toWorkspace(row)
}

export function renameWorkspace(id: string, nombre: string): Workspace {
  getDb().update(workspaces).set({ nombre: nombre.trim() }).where(eq(workspaces.id, id)).run()
  const row = getDb().select().from(workspaces).where(eq(workspaces.id, id)).get()
  if (!row) throw new Error('Workspace no encontrado')
  return toWorkspace(row)
}

export function deleteWorkspace(id: string): void {
  for (const panel of listPanels(id)) {
    deletePanel(panel.id)
  }
  deleteNotesForScope('workspace', id)
  getDb().delete(workspaces).where(eq(workspaces.id, id)).run()
}
