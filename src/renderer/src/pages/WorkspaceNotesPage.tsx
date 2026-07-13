import { useParams } from 'react-router-dom'
import { NotesSection } from '@renderer/components/NotesSection'
import { PageHeader } from '@renderer/components/PageHeader'
import { useT } from '@renderer/i18n/useT'

export function WorkspaceNotesPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const t = useT()
  if (!workspaceId) return null
  return (
    <div className="p-8">
      <PageHeader eyebrow={t('notes.eyebrow')} title={t('notes.workspaceTitle')} />
      <NotesSection scopeType="workspace" scopeId={workspaceId} />
    </div>
  )
}
