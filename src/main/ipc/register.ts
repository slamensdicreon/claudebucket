import { registerWorkspaceHandlers } from './workspaces'
import { registerPanelHandlers } from './panels'
import { registerPersonaHandlers } from './personas'
import { registerTestHandlers } from './tests'
import { registerChatHandlers } from './chat'
import { registerSettingsHandlers } from './settings'
import { registerVersionHandlers } from './versions'
import { registerThemeHandlers } from './themes'
import { registerFollowUpHandlers } from './followUps'
import { registerFunnelHandlers } from './funnel'
import { registerComparisonHandlers } from './comparison'
import { registerTimelineHandlers } from './timeline'
import { registerExportHandlers } from './exportReport'
import { registerMarketplaceHandlers } from './marketplace'
import { registerUpdateHandlers } from './update'
import { registerNoteHandlers } from './notes'

export function registerIpcHandlers(): void {
  registerWorkspaceHandlers()
  registerPanelHandlers()
  registerPersonaHandlers()
  registerTestHandlers()
  registerChatHandlers()
  registerSettingsHandlers()
  registerVersionHandlers()
  registerThemeHandlers()
  registerFollowUpHandlers()
  registerFunnelHandlers()
  registerComparisonHandlers()
  registerTimelineHandlers()
  registerExportHandlers()
  registerMarketplaceHandlers()
  registerUpdateHandlers()
  registerNoteHandlers()
}
