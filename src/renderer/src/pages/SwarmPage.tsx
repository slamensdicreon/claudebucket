import { Navigate, useParams } from 'react-router-dom'

export function SwarmPage() {
  const { workspaceId, panelId, testId } = useParams<{ workspaceId: string; panelId: string; testId: string }>()
  if (!workspaceId || !panelId || !testId) return <Navigate to="/workspaces" replace />
  return <Navigate to={`/w/${workspaceId}/panels/${panelId}/tests/${testId}`} replace />
}
