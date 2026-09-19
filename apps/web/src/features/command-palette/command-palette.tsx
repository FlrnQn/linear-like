import * as Dialog from '@radix-ui/react-dialog'
import { useNavigate } from '@tanstack/react-router'
import { Command } from 'cmdk'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'

import { useLogout } from '@/features/auth/use-logout'
import { useIssueSearch } from '@/features/search/use-issue-search'
import { useTeams } from '@/features/teams/use-teams'
import { useProjects } from '@/features/projects/use-projects'
import { useUiStore } from '@/stores/ui-store'
import { useWorkspaceStore } from '@/stores/workspace-store'

export function CommandPalette() {
  const open = useUiStore((state) => state.commandPaletteOpen)
  const setOpen = useUiStore((state) => state.setCommandPaletteOpen)
  const theme = useUiStore((state) => state.theme)
  const toggleTheme = useUiStore((state) => state.toggleTheme)
  const workspaceId = useWorkspaceStore((state) => state.activeWorkspaceId ?? undefined)

  const navigate = useNavigate()
  const logout = useLogout()
  const [query, setQuery] = useState('')

  const teams = useTeams(workspaceId)
  const projects = useProjects(workspaceId)
  const search = useIssueSearch(workspaceId, query)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(!open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, setOpen])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const showNavigation = query.trim().length === 0

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay forceMount asChild>
              <motion.div
                className="fixed inset-0 z-[100] bg-black/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </Dialog.Overlay>
            <Dialog.Content
              forceMount
              asChild
              aria-describedby={undefined}
              onOpenAutoFocus={(event) => event.preventDefault()}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -8 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="border-border bg-surface fixed left-1/2 top-[18%] z-[100] w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border shadow-2xl"
              >
                <Dialog.Title className="sr-only">Command menu</Dialog.Title>
                <Command shouldFilter={false} className="flex flex-col">
                  <Command.Input
                    autoFocus
                    value={query}
                    onValueChange={setQuery}
                    placeholder="Search issues, jump to a team or project…"
                    className="border-border placeholder:text-muted-foreground border-b bg-transparent px-4 py-3 text-sm outline-none"
                  />
                  <Command.List className="max-h-80 overflow-y-auto p-2">
                    <Command.Empty className="text-muted-foreground px-2 py-6 text-center text-sm">
                      No results found.
                    </Command.Empty>

                    {!showNavigation && (
                      <Command.Group
                        heading="Issues"
                        className="text-muted-foreground px-2 py-1.5 text-xs font-medium [&_[cmdk-group-items]]:mt-1"
                      >
                        {search.data?.map((result) => (
                          <Command.Item
                            key={result.id}
                            onSelect={() => {
                              setOpen(false)
                              void navigate({
                                to: '/teams/$teamId',
                                params: { teamId: result.teamId },
                                search: { issue: result.id },
                              })
                            }}
                            className="text-foreground aria-selected:bg-accent aria-selected:text-accent-foreground flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm"
                          >
                            <span className="text-muted-foreground text-xs">
                              {result.identifier}
                            </span>
                            <span className="truncate">{result.title}</span>
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}

                    {showNavigation && (
                      <>
                        <Command.Group
                          heading="Navigation"
                          className="text-muted-foreground px-2 py-1.5 text-xs font-medium [&_[cmdk-group-items]]:mt-1"
                        >
                          <Command.Item
                            onSelect={() => {
                              setOpen(false)
                              void navigate({ to: '/' })
                            }}
                            className="text-foreground aria-selected:bg-accent aria-selected:text-accent-foreground cursor-pointer rounded-lg px-2 py-2 text-sm"
                          >
                            Home
                          </Command.Item>
                          {teams.data?.map((team) => (
                            <Command.Item
                              key={team.id}
                              onSelect={() => {
                                setOpen(false)
                                void navigate({ to: '/teams/$teamId', params: { teamId: team.id } })
                              }}
                              className="text-foreground aria-selected:bg-accent aria-selected:text-accent-foreground cursor-pointer rounded-lg px-2 py-2 text-sm"
                            >
                              Go to {team.name}
                            </Command.Item>
                          ))}
                          {projects.data?.map((project) => (
                            <Command.Item
                              key={project.id}
                              onSelect={() => {
                                setOpen(false)
                                void navigate({
                                  to: '/projects/$projectId',
                                  params: { projectId: project.id },
                                })
                              }}
                              className="text-foreground aria-selected:bg-accent aria-selected:text-accent-foreground cursor-pointer rounded-lg px-2 py-2 text-sm"
                            >
                              Go to {project.name}
                            </Command.Item>
                          ))}
                          <Command.Item
                            onSelect={() => {
                              setOpen(false)
                              void navigate({ to: '/settings' })
                            }}
                            className="text-foreground aria-selected:bg-accent aria-selected:text-accent-foreground cursor-pointer rounded-lg px-2 py-2 text-sm"
                          >
                            Open settings
                          </Command.Item>
                        </Command.Group>

                        <Command.Group
                          heading="Actions"
                          className="text-muted-foreground px-2 py-1.5 text-xs font-medium [&_[cmdk-group-items]]:mt-1"
                        >
                          <Command.Item
                            onSelect={() => {
                              toggleTheme()
                              setOpen(false)
                            }}
                            className="text-foreground aria-selected:bg-accent aria-selected:text-accent-foreground cursor-pointer rounded-lg px-2 py-2 text-sm"
                          >
                            Switch to {theme === 'dark' ? 'light' : 'dark'} mode
                          </Command.Item>
                          <Command.Item
                            onSelect={() => {
                              setOpen(false)
                              logout.mutate()
                            }}
                            className="text-foreground aria-selected:bg-accent aria-selected:text-accent-foreground cursor-pointer rounded-lg px-2 py-2 text-sm"
                          >
                            Sign out
                          </Command.Item>
                        </Command.Group>
                      </>
                    )}
                  </Command.List>

                  <div className="border-border text-muted-foreground flex items-center gap-3 border-t px-4 py-2 text-xs">
                    <span>
                      <kbd className="border-border rounded border px-1">↑↓</kbd> navigate
                    </span>
                    <span>
                      <kbd className="border-border rounded border px-1">↵</kbd> select
                    </span>
                    <span>
                      <kbd className="border-border rounded border px-1">esc</kbd> close
                    </span>
                  </div>
                </Command>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
