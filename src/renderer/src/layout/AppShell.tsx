import { NavLink, Outlet } from 'react-router-dom'
import { LayoutGrid, Settings, GitCompare, FileText } from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import { Logo } from './Logo'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'
import { ProviderSwitcher } from './ProviderSwitcher'
import { UpdateBanner } from '@renderer/components/UpdateBanner'
import { useAppStore } from '@renderer/store/useAppStore'
import { useT } from '@renderer/i18n/useT'

function NavItem({ to, icon: Icon, label }: { to: string; icon: typeof LayoutGrid; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] font-medium text-text-dim transition-colors hover:text-text',
          isActive && 'bg-surface-2 text-text'
        )
      }
    >
      <Icon size={15} />
      {label}
    </NavLink>
  )
}

export function AppShell() {
  const currentWorkspaceId = useAppStore((s) => s.currentWorkspaceId)
  const t = useT()

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg text-text">
      <aside className="flex w-[220px] flex-none flex-col gap-4 border-r border-border bg-bg p-3">
        <div className="px-1 py-2">
          <Logo />
        </div>
        <nav className="flex flex-col gap-1">
          <NavItem to={currentWorkspaceId ? `/w/${currentWorkspaceId}/panels` : '/workspaces'} icon={LayoutGrid} label={t('nav.paneles')} />
          {currentWorkspaceId && <NavItem to={`/w/${currentWorkspaceId}/comparisons`} icon={GitCompare} label={t('nav.comparar')} />}
          {currentWorkspaceId && <NavItem to={`/w/${currentWorkspaceId}/notes`} icon={FileText} label={t('nav.notes')} />}
          <NavItem to="/settings" icon={Settings} label={t('nav.ajustes')} />
        </nav>
        <div className="mt-auto">
          <WorkspaceSwitcher />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-none items-center justify-between border-b border-border px-6 py-3">
          <div className="font-mono-label text-[10.5px] font-semibold tracking-wide text-text-dim">
            {t('shell.tagline')} &middot; v2
          </div>
          <ProviderSwitcher />
        </header>
        <UpdateBanner />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
