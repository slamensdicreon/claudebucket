import { and, desc, eq } from 'drizzle-orm'
import { getDb } from '../client'
import { notes } from '../schema'
import { newId, now } from '../ids'
import type { Note, NoteScopeType } from '@shared/types'

function toNote(row: typeof notes.$inferSelect): Note {
  return {
    id: row.id,
    scopeType: row.scopeType as NoteScopeType,
    scopeId: row.scopeId,
    title: row.title,
    contentMarkdown: row.contentMarkdown,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

export function listNotes(scopeType: NoteScopeType, scopeId: string): Note[] {
  return getDb()
    .select()
    .from(notes)
    .where(and(eq(notes.scopeType, scopeType), eq(notes.scopeId, scopeId)))
    .orderBy(desc(notes.updatedAt))
    .all()
    .map(toNote)
}

export function createNote(input: { scopeType: NoteScopeType; scopeId: string; title: string; contentMarkdown: string }): Note {
  const timestamp = now()
  const row = {
    id: newId(),
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    title: input.title.trim() || 'Nota sin titulo',
    contentMarkdown: input.contentMarkdown ?? '',
    createdAt: timestamp,
    updatedAt: timestamp
  }
  getDb().insert(notes).values(row).run()
  return toNote(row)
}

export function updateNote(id: string, input: Partial<{ title: string; contentMarkdown: string }>): Note {
  getDb()
    .update(notes)
    .set({ ...input, updatedAt: now() })
    .where(eq(notes.id, id))
    .run()
  const row = getDb().select().from(notes).where(eq(notes.id, id)).get()
  if (!row) throw new Error('Nota no encontrada')
  return toNote(row)
}

export function deleteNote(id: string): void {
  getDb().delete(notes).where(eq(notes.id, id)).run()
}

export function deleteNotesForScope(scopeType: NoteScopeType, scopeId: string): void {
  getDb().delete(notes).where(and(eq(notes.scopeType, scopeType), eq(notes.scopeId, scopeId))).run()
}
