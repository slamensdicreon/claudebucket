import { useEffect, useMemo, useState } from 'react'
import { FileText, Plus, Trash2 } from 'lucide-react'
import { api } from '@renderer/lib/api'
import type { Note, NoteScopeType } from '@shared/types'
import { Button } from '@renderer/components/ui/button'
import { Card } from '@renderer/components/ui/card'
import { Input } from '@renderer/components/ui/input'
import { Textarea } from '@renderer/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { useT } from '@renderer/i18n/useT'

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

function inlineMarkdown(text: string): string {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
}

function markdownToHtml(markdown: string): string {
  const lines = markdown.split(/\r?\n/)
  const html: string[] = []
  let inList = false
  for (const line of lines) {
    if (/^\s*-\s+/.test(line)) {
      if (!inList) {
        html.push('<ul>')
        inList = true
      }
      html.push(`<li>${inlineMarkdown(line.replace(/^\s*-\s+/, ''))}</li>`)
      continue
    }
    if (inList) {
      html.push('</ul>')
      inList = false
    }
    if (!line.trim()) {
      html.push('<br />')
    } else if (line.startsWith('### ')) {
      html.push(`<h3>${inlineMarkdown(line.slice(4))}</h3>`)
    } else if (line.startsWith('## ')) {
      html.push(`<h2>${inlineMarkdown(line.slice(3))}</h2>`)
    } else if (line.startsWith('# ')) {
      html.push(`<h1>${inlineMarkdown(line.slice(2))}</h1>`)
    } else if (line.startsWith('> ')) {
      html.push(`<blockquote>${inlineMarkdown(line.slice(2))}</blockquote>`)
    } else {
      html.push(`<p>${inlineMarkdown(line)}</p>`)
    }
  }
  if (inList) html.push('</ul>')
  return html.join('')
}

export function NotesSection({ scopeType, scopeId }: { scopeType: NoteScopeType; scopeId: string }) {
  const t = useT()
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = notes.find((n) => n.id === selectedId) ?? notes[0] ?? null
  const preview = useMemo(() => markdownToHtml(selected?.contentMarkdown ?? ''), [selected?.contentMarkdown])

  async function refresh() {
    const list = await api.notes.list({ scopeType, scopeId })
    setNotes(list)
    setSelectedId((current) => (current && list.some((n) => n.id === current) ? current : list[0]?.id ?? null))
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeType, scopeId])

  async function createNote() {
    const note = await api.notes.create({
      scopeType,
      scopeId,
      title: t('notes.defaultTitle'),
      contentMarkdown: `# ${t('notes.defaultTitle')}\n\n- `
    })
    setNotes((prev) => [note, ...prev])
    setSelectedId(note.id)
  }

  async function updateSelected(patch: Partial<{ title: string; contentMarkdown: string }>) {
    if (!selected) return
    const updated = await api.notes.update(selected.id, patch)
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
  }

  async function deleteSelected() {
    if (!selected) return
    await api.notes.delete(selected.id)
    await refresh()
  }

  return (
    <div className="grid max-w-5xl grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
      <Card className="p-3">
        <Button size="sm" className="w-full" onClick={createNote}>
          <Plus size={14} /> {t('notes.new')}
        </Button>
        <div className="mt-3 space-y-1">
          {notes.length === 0 ? (
            <div className="py-8 text-center text-xs text-text-dim">
              <FileText size={16} className="mx-auto mb-2" />
              {t('notes.empty')}
            </div>
          ) : (
            notes.map((note) => (
              <button
                key={note.id}
                className={`w-full truncate rounded-md px-2 py-2 text-left text-xs ${
                  selected?.id === note.id ? 'bg-surface-2 text-text' : 'text-text-muted hover:bg-surface-2'
                }`}
                onClick={() => setSelectedId(note.id)}
              >
                {note.title}
              </button>
            ))
          )}
        </div>
      </Card>
      <Card className="min-h-[420px] p-4">
        {selected ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input value={selected.title} onChange={(e) => updateSelected({ title: e.target.value })} />
              <Button size="sm" variant="secondary" onClick={deleteSelected}>
                <Trash2 size={14} />
              </Button>
            </div>
            <Tabs defaultValue="edit">
              <TabsList>
                <TabsTrigger value="edit">{t('notes.edit')}</TabsTrigger>
                <TabsTrigger value="preview">{t('notes.preview')}</TabsTrigger>
              </TabsList>
              <TabsContent value="edit">
                <Textarea
                  className="min-h-[300px] font-mono text-xs"
                  value={selected.contentMarkdown}
                  onChange={(e) => updateSelected({ contentMarkdown: e.target.value })}
                />
              </TabsContent>
              <TabsContent value="preview">
                <div
                  className="prose-notes min-h-[300px] rounded-lg border border-border bg-bg p-4 text-sm leading-relaxed text-text-muted"
                  dangerouslySetInnerHTML={{ __html: preview }}
                />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="py-20 text-center text-sm text-text-dim">{t('notes.empty')}</div>
        )}
      </Card>
    </div>
  )
}
