import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { motion } from 'motion/react'

import { ActivityFeed } from '@/features/activities/activity-feed'
import { useActivities } from '@/features/activities/use-activities'
import { CommentForm } from '@/features/comments/comment-form'
import { CommentList } from '@/features/comments/comment-list'
import { useComments } from '@/features/comments/use-comments'
import { useCycles } from '@/features/cycles/use-cycles'
import { useProjects } from '@/features/projects/use-projects'
import { useWorkspaceMembers } from '@/features/workspaces/use-workspace-members'

import { PrioritySelect } from './priority-select'
import { StatusSelect } from './status-select'
import { useDeleteIssue } from './use-delete-issue'
import { useIssue } from './use-issue'
import { useUpdateIssue } from './use-update-issue'

export function IssueDetailDialog({
  issueId,
  workspaceId,
  onClose,
}: {
  issueId: string
  workspaceId: string
  onClose: () => void
}) {
  const issue = useIssue(issueId)
  const comments = useComments(issueId)
  const activities = useActivities(issueId)
  const members = useWorkspaceMembers(workspaceId)
  const projects = useProjects(workspaceId)
  const cycles = useCycles(issue.data?.teamId)
  const updateIssue = useUpdateIssue()
  const deleteIssue = useDeleteIssue()

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            className="fixed inset-0 z-50 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          />
        </Dialog.Overlay>
        <Dialog.Content asChild onOpenAutoFocus={(event) => event.preventDefault()}>
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="border-border bg-surface fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-xl border p-6 focus:outline-none"
          >
            <Dialog.Title className="text-muted-foreground text-xs font-medium">
              {issue.data?.identifier ?? 'Issue'}
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Details, activity, and comments for this issue
            </Dialog.Description>
            <Dialog.Close className="text-muted-foreground hover:text-foreground absolute right-4 top-4">
              <X className="h-5 w-5" />
            </Dialog.Close>

            {!issue.data ? (
              <p className="text-muted-foreground mt-4 text-sm">Loading…</p>
            ) : (
              <>
                <h2 className="mb-4 mt-1 pr-8 text-lg font-semibold">{issue.data.title}</h2>

                {issue.data.description && (
                  <p className="text-muted-foreground mb-6 whitespace-pre-wrap text-sm">
                    {issue.data.description}
                  </p>
                )}

                <div className="border-border mb-6 grid grid-cols-2 gap-3 rounded-lg border p-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">Status</p>
                    <StatusSelect
                      value={issue.data.status}
                      onChange={(status) => updateIssue.mutate({ issueId, input: { status } })}
                    />
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">Priority</p>
                    <PrioritySelect
                      value={issue.data.priority}
                      onChange={(priority) => updateIssue.mutate({ issueId, input: { priority } })}
                    />
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">Assignee</p>
                    <select
                      value={issue.data.assignee?.id ?? ''}
                      onChange={(e) =>
                        updateIssue.mutate({
                          issueId,
                          input: { assigneeId: e.target.value || null },
                        })
                      }
                      className="border-border bg-background focus:border-accent rounded-md border px-2 py-1 text-sm outline-none"
                    >
                      <option value="">Unassigned</option>
                      {members.data?.map((member) => (
                        <option key={member.userId} value={member.userId}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">Project</p>
                    <select
                      value={issue.data.projectId ?? ''}
                      onChange={(e) =>
                        updateIssue.mutate({
                          issueId,
                          input: { projectId: e.target.value || null },
                        })
                      }
                      className="border-border bg-background focus:border-accent rounded-md border px-2 py-1 text-sm outline-none"
                    >
                      <option value="">No project</option>
                      {projects.data?.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">Cycle</p>
                    <select
                      value={issue.data.cycleId ?? ''}
                      onChange={(e) =>
                        updateIssue.mutate({
                          issueId,
                          input: { cycleId: e.target.value || null },
                        })
                      }
                      className="border-border bg-background focus:border-accent rounded-md border px-2 py-1 text-sm outline-none"
                    >
                      <option value="">No cycle</option>
                      {cycles.data?.map((cycle) => (
                        <option key={cycle.id} value={cycle.id}>
                          {cycle.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">Created by</p>
                    <p>{issue.data.creator.name}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="mb-2 text-sm font-medium">Activity</h3>
                  <ActivityFeed activities={activities.data ?? []} />
                </div>

                <div className="mb-4">
                  <h3 className="mb-2 text-sm font-medium">Comments</h3>
                  <CommentList comments={comments.data ?? []} />
                </div>

                <CommentForm issueId={issueId} />

                <button
                  type="button"
                  onClick={() => deleteIssue.mutate(issueId, { onSuccess: onClose })}
                  className="mt-6 self-start text-xs text-red-500 hover:underline"
                >
                  Delete issue
                </button>
              </>
            )}
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
