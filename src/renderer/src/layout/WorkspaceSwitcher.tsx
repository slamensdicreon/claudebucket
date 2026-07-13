import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '@renderer/lib/api'
import { useAppStore } from '@renderer/store/useAppStore'
import type { Workspace } from '@shared/types'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { useT } from '@renderer/i18n/useT'

export function WorkspaceSwitcher() {
  const t = useT()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [newName, setNewName] = useState('')
  const currentWorkspaceId = useAppStore((s) => s.currentWorkspaceId)
  const setCurrentWorkspaceId = useAppStore((s) => s.setCurrentWorkspaceId)

  async function refresh(selectId?: string) {
    const list = await api.workspaces.list()
    setWorkspaces(list)
    setLoading(false)
    if (selectId) {
      setCurrentWorkspaceId(selectId)
    } else if (!currentWorkspaceId && list.length > 0) {
      setCurrentWorkspaceId(list[0].id)
    } else if (currentWorkspaceId && !list.some((w) => w.id === currentWorkspaceId)) {
      setCurrentWorkspaceId(list[0]?.id ?? null)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCreate() {
    if (!newName.trim()) return
    const ws = await api.workspaces.create(newName.trim())
    setNewName('')
    setOpen(false)
    await refresh(ws.id)
  }

  async function handleDeleteCurrent() {
    if (!currentWorkspaceId) return
    setDeleting(true)
    try {
      await api.workspaces.delete(currentWorkspaceId)
      setDeleteOpen(false)
      setCurrentWorkspaceId(null)
      await refresh()
    } finally {
      setDeleting(false)
    }
  }

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId)

  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="mb-1.5 font-mono-label text-[9.5px] font-semibold tracking-wider text-text-dim">{t('workspaceSwitcher.label')}</div>
      {loading ? (
        <div className="text-xs text-text-dim">{t('workspaceSwitcher.loading')}</div>
      ) : workspaces.length === 0 ? (
        <div className="text-xs text-text-dim">{t('workspaceSwitcher.empty')}</div>
      ) : (
        <select
          className="w-full truncate bg-transparent text-[12.5px] font-medium text-text outline-none"
          value={currentWorkspaceId ?? ''}
          onChange={(e) => setCurrentWorkspaceId(e.target.value)}
        >
          {workspaces.map((w) => (
            <option key={w.id} value={w.id} className="bg-surface text-text">
              {w.nombre}
            </option>
          ))}
        </select>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="mt-2 flex items-center gap-1 text-[11px] font-medium text-primary">
            <Plus size={12} /> {t('workspaceSwitcher.new')}
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>{t('workspaceSwitcher.newTitle')}</DialogTitle>
          <div className="space-y-3">
            <div>
              <Label htmlFor="ws-name">{t('workspaceSwitcher.nameLabel')}</Label>
              <Input
                id="ws-name"
                autoFocus
                className="mt-1.5"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t('workspaceSwitcher.namePlaceholder')}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <Button className="w-full" onClick={handleCreate}>
              {t('workspaceSwitcher.create')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {currentWorkspace && (
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogTrigger asChild>
            <button className="mt-2 flex items-center gap-1 text-[11px] font-medium text-danger">
              <Trash2 size={12} /> {t('workspaceSwitcher.delete')}
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>{t('workspaceSwitcher.deleteTitle')}</DialogTitle>
            <div className="space-y-4">
              <p className="text-sm text-text-muted">{t('workspaceSwitcher.deleteConfirm', { name: currentWorkspace.nombre })}</p>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setDeleteOpen(false)} disabled={deleting}>
                  {t('personaDetail.cancel')}
                </Button>
                <Button onClick={handleDeleteCurrent} disabled={deleting}>
                  {deleting ? t('workspaceSwitcher.deleting') : t('workspaceSwitcher.delete')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
