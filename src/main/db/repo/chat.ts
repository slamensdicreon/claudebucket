import { eq, asc } from 'drizzle-orm'
import { getDb } from '../client'
import { chatMensajes } from '../schema'
import { newId, now } from '../ids'
import type { ChatMensaje } from '@shared/types'

function toMensaje(row: typeof chatMensajes.$inferSelect): ChatMensaje {
  return {
    id: row.id,
    personaId: row.personaId,
    role: row.role as ChatMensaje['role'],
    contenido: row.contenido,
    createdAt: row.createdAt
  }
}

export function listChatMensajes(personaId: string): ChatMensaje[] {
  const rows = getDb()
    .select()
    .from(chatMensajes)
    .where(eq(chatMensajes.personaId, personaId))
    .orderBy(asc(chatMensajes.createdAt))
    .all()
  return rows.map(toMensaje)
}

export function saveChatMensaje(personaId: string, role: ChatMensaje['role'], contenido: string): ChatMensaje {
  const row = { id: newId(), personaId, role, contenido, createdAt: now() }
  getDb().insert(chatMensajes).values(row).run()
  return toMensaje(row)
}
