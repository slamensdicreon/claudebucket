import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@renderer/layout/AppShell'
import { WorkspacesPage } from '@renderer/pages/WorkspacesPage'
import { PanelsPage } from '@renderer/pages/PanelsPage'
import { PanelDetailPage } from '@renderer/pages/PanelDetailPage'
import { PersonaDetailPage } from '@renderer/pages/PersonaDetailPage'
import { TestConfigPage } from '@renderer/pages/TestConfigPage'
import { TestResultsPage } from '@renderer/pages/TestResultsPage'
import { FunnelResultsPage } from '@renderer/pages/FunnelResultsPage'
import { SwarmPage } from '@renderer/pages/SwarmPage'
import { ComparisonPage } from '@renderer/pages/ComparisonPage'
import { PanelTimelinePage } from '@renderer/pages/PanelTimelinePage'
import { SettingsPage } from '@renderer/pages/SettingsPage'
import { WorkspaceNotesPage } from '@renderer/pages/WorkspaceNotesPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/workspaces" replace />} />
        <Route path="/workspaces" element={<WorkspacesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/w/:workspaceId/panels" element={<PanelsPage />} />
        <Route path="/w/:workspaceId/comparisons" element={<ComparisonPage />} />
        <Route path="/w/:workspaceId/notes" element={<WorkspaceNotesPage />} />
        <Route path="/w/:workspaceId/panels/:panelId" element={<PanelDetailPage />} />
        <Route path="/w/:workspaceId/panels/:panelId/timeline" element={<PanelTimelinePage />} />
        <Route path="/w/:workspaceId/panels/:panelId/personas/:personaId" element={<PersonaDetailPage />} />
        <Route path="/w/:workspaceId/panels/:panelId/tests/new" element={<TestConfigPage />} />
        <Route path="/w/:workspaceId/panels/:panelId/tests/:testId" element={<TestResultsPage />} />
        <Route path="/w/:workspaceId/panels/:panelId/tests/:testId/funnel" element={<FunnelResultsPage />} />
        <Route path="/w/:workspaceId/panels/:panelId/tests/:testId/swarm" element={<SwarmPage />} />
        <Route path="*" element={<Navigate to="/workspaces" replace />} />
      </Route>
    </Routes>
  )
}
