import { cn } from '@lynx/shared'
import { Link } from '@tanstack/react-router'
import { Home, PanelLeftClose, PanelLeftOpen, Search, Settings } from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'

import { LanguageSwitch } from '@/components/language-switch'
import { Tooltip } from '@/components/tooltip'
import { useProjects } from '@/features/projects/use-projects'
import { useTeams } from '@/features/teams/use-teams'
import { useUiStore } from '@/stores/ui-store'
import { useWorkspaceStore } from '@/stores/workspace-store'

export function Sidebar() {
  const { t } = useTranslation()
  const collapsed = useUiStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)
  const setCommandPaletteOpen = useUiStore((state) => state.setCommandPaletteOpen)
  const workspaceId = useWorkspaceStore((state) => state.activeWorkspaceId ?? undefined)

  const teams = useTeams(workspaceId)
  const projects = useProjects(workspaceId)

  const linkClass =
    'rounded-lg px-2 py-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground truncate'
  const activeLinkClass = { className: 'bg-background text-foreground font-medium' }

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 232 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="border-border bg-surface sticky top-0 flex h-screen shrink-0 flex-col overflow-hidden border-r"
    >
      <div className="flex items-center justify-between px-4 py-4">
        {!collapsed && <span className="text-sm font-semibold tracking-wide">LYNX</span>}
        <Tooltip
          content={collapsed ? t('sidebar.expandSidebar') : t('sidebar.collapseSidebar')}
        >
          <button
            type="button"
            onClick={toggleSidebar}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label={collapsed ? t('sidebar.expandSidebar') : t('sidebar.collapseSidebar')}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </Tooltip>
      </div>

      <button
        type="button"
        onClick={() => setCommandPaletteOpen(true)}
        className="border-border text-muted-foreground hover:text-foreground mx-3 mb-4 flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{t('sidebar.search')}</span>
            <kbd className="border-border rounded border px-1">⌘K</kbd>
          </>
        )}
      </button>

      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 pb-4 text-sm">
        <Link to="/" className={linkClass} activeProps={activeLinkClass}>
          <span className="flex items-center gap-2">
            <Home className="h-4 w-4 shrink-0" />
            {!collapsed && t('sidebar.home')}
          </span>
        </Link>

        {!collapsed && teams.data && teams.data.length > 0 && (
          <div>
            <p className="text-muted-foreground mb-1 px-2 text-xs font-medium uppercase tracking-wide">
              {t('sidebar.teams')}
            </p>
            <div className="flex flex-col gap-0.5">
              {teams.data.map((team) => (
                <Link
                  key={team.id}
                  to="/teams/$teamId"
                  params={{ teamId: team.id }}
                  className={linkClass}
                  activeProps={activeLinkClass}
                >
                  {team.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {!collapsed && projects.data && projects.data.length > 0 && (
          <div>
            <p className="text-muted-foreground mb-1 px-2 text-xs font-medium uppercase tracking-wide">
              {t('sidebar.projects')}
            </p>
            <div className="flex flex-col gap-0.5">
              {projects.data.map((project) => (
                <Link
                  key={project.id}
                  to="/projects/$projectId"
                  params={{ projectId: project.id }}
                  className={cn(linkClass, 'flex items-center gap-2')}
                  activeProps={activeLinkClass}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: project.color ?? '#94a3b8' }}
                  />
                  <span className="truncate">{project.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div
        className={cn(
          'border-border border-t px-3 py-3 flex gap-2',
          collapsed ? 'flex-col items-center' : 'items-center',
        )}
      >
        <Link
          to="/settings"
          className={cn(linkClass, 'flex flex-1 items-center gap-2')}
          activeProps={activeLinkClass}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && t('sidebar.settings')}
        </Link>
        <LanguageSwitch collapsed={collapsed} />
      </div>
    </motion.aside>
  )
}
