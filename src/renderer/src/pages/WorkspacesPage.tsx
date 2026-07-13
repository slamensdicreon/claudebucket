import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { useAppStore } from '@renderer/store/useAppStore'
import { api } from '@renderer/lib/api'
import { Logo } from '@renderer/layout/Logo'
import { Button } from '@renderer/components/ui/button'
import { useT } from '@renderer/i18n/useT'

export function WorkspacesPage() {
  const currentWorkspaceId = useAppStore((s) => s.currentWorkspaceId)
  const setCurrentWorkspaceId = useAppStore((s) => s.setCurrentWorkspaceId)
  const navigate = useNavigate()
  const [seeding, setSeeding] = useState(false)
  const t = useT()

  useEffect(() => {
    if (currentWorkspaceId) navigate(`/w/${currentWorkspaceId}/panels`, { replace: true })
  }, [currentWorkspaceId, navigate])

  async function handleSeedDemo() {
    setSeeding(true)
    try {
      const workspace = await api.workspaces.seedDemo()
      setCurrentWorkspaceId(workspace.id)
      navigate(`/w/${workspace.id}/panels`)
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <Logo withWordmark={false} />
      <div className="text-lg font-semibold text-text">{t('workspaces.welcome')}</div>
      <div className="max-w-sm text-sm text-text-muted">{t('workspaces.subtitle')}</div>
      <Button variant="secondary" size="sm" className="mt-2" onClick={handleSeedDemo} disabled={seeding}>
        <Sparkles size={14} /> {seeding ? t('workspaces.seedingDemo') : t('workspaces.seedDemo')}
      </Button>
      <div className="max-w-sm text-xs text-text-dim">{t('workspaces.seedDemoHint')}</div>
    </div>
  )
}
