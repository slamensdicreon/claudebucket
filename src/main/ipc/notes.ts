import { ipcMain } from 'electron'
import { IPC } from '@shared/ipcChannels'
import type { NoteScopeType } from '@shared/types'
import * as notesRepo from '../db/repo/notes'

export function registerNoteHandlers(): void {
  ipcMain.handle(IPC.notesList, (_e, input: { scopeType: NoteScopeType; scopeId: string }) =>
    notesRepo.listNotes(input.scopeType, input.scopeId)
  )
  ipcMain.handle(
    IPC.notesCreate,
    (_e, input: { scopeType: NoteScopeType; scopeId: string; title: string; contentMarkdown: string }) =>
      notesRepo.createNote(input)
  )
  ipcMain.handle(IPC.notesUpdate, (_e, id: string, patch: Partial<{ title: string; contentMarkdown: string }>) =>
    notesRepo.updateNote(id, patch)
  )
  ipcMain.handle(IPC.notesDelete, (_e, id: string) => notesRepo.deleteNote(id))
}
