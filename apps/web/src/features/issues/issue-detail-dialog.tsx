import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
  const issue = useIssue(issueId)
  const comments = useComments(issueId)
  const activities = useActivities(issueId)
  const members = useWorkspaceMembers(workspaceId)
  const projects = useProjects(workspaceId)
  const cycles = useCycles(issue.data?.teamId)
  const updateIssue = useUpdateIssue()
  const deleteIssue = useDeleteIssue()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (issue.data) {
      setTitle(issue.data.title)
      setDescription(issue.data.description ?? '')
    }
  }, [issue.data])

  function commitTitle() {
    const trimmed = title.trim()
    if (!issue.data || trimmed.length === 0 || trimmed === issue.data.title) {
      setTitle(issue.data?.title ?? '')
      return
    }
    updateIssue.mutate({ issueId, input: { title: trimmed } })
  }

  function commitDescription() {
    if (!issue.data) return
    const normalized = description.trim().length === 0 ? null : description
    if (normalized === (issue.data.description ?? null)) return
    updateIssue.mutate({ issueId, input: { description: normalized } })
  }

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
              {issue.data?.identifier ?? t('issue.detail.fallbackTitle')}
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              {t('issue.detail.description')}
            </Dialog.Description>
            <Dialog.Close
              aria-label={t('common.close')}
              className="text-muted-foreground hover:text-foreground absolute right-4 top-4"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>

            {!issue.data ? (
              <p className="text-muted-foreground mt-4 text-sm">{t('common.loading')}</p>
            ) : (
              <>
                <input
                  aria-label={t('issue.detail.titleAriaLabel')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={commitTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur()
                  }}
                  className="focus:border-accent -ml-2 mb-4 mt-1 w-[calc(100%-1rem)] rounded-md border border-transparent px-2 py-0.5 pr-8 text-lg font-semibold outline-none"
                />

                <textarea
                  aria-label={t('issue.detail.descriptionAriaLabel')}
                  placeholder={t('issue.detail.descriptionPlaceholder')}
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={commitDescription}
                  className="text-muted-foreground focus:border-accent -ml-2 mb-6 w-[calc(100%-1rem)] resize-none rounded-md border border-transparent px-2 py-0.5 text-sm outline-none"
                />

                <div className="border-border mb-6 grid grid-cols-2 gap-3 rounded-lg border p-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">{t('issue.fields.status')}</p>
                    <StatusSelect
                      value={issue.data.status}
                      onChange={(status) => updateIssue.mutate({ issueId, input: { status } })}
                    />
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">{t('issue.fields.priority')}</p>
                    <PrioritySelect
                      value={issue.data.priority}
                      onChange={(priority) => updateIssue.mutate({ issueId, input: { priority } })}
                    />
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">{t('issue.fields.assignee')}</p>
                    <select
                      aria-label={t('issue.fields.assignee')}
                      value={issue.data.assignee?.id ?? ''}
                      onChange={(e) =>
                        updateIssue.mutate({
                          issueId,
                          input: { assigneeId: e.target.value || null },
                        })
                      }
                      className="border-border bg-background focus:border-accent rounded-md border px-2 py-1 text-sm outline-none"
                    >
                      <option value="">{t('common.unassigned')}</option>
                      {members.data?.map((member) => (
                        <option key={member.userId} value={member.userId}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">{t('issue.fields.project')}</p>
                    <select
                      aria-label={t('issue.fields.project')}
                      value={issue.data.projectId ?? ''}
                      onChange={(e) =>
                        updateIssue.mutate({
                          issueId,
                          input: { projectId: e.target.value || null },
                        })
                      }
                      className="border-border bg-background focus:border-accent rounded-md border px-2 py-1 text-sm outline-none"
                    >
                      <option value="">{t('common.noProject')}</option>
                      {projects.data?.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">{t('issue.fields.cycle')}</p>
                    <select
                      aria-label={t('issue.fields.cycle')}
                      value={issue.data.cycleId ?? ''}
                      onChange={(e) =>
                        updateIssue.mutate({
                          issueId,
                          input: { cycleId: e.target.value || null },
                        })
                      }
                      className="border-border bg-background focus:border-accent rounded-md border px-2 py-1 text-sm outline-none"
                    >
                      <option value="">{t('common.noCycle')}</option>
                      {cycles.data?.map((cycle) => (
                        <option key={cycle.id} value={cycle.id}>
                          {cycle.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">{t('issue.fields.createdBy')}</p>
                    <p>{issue.data.creator.name}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="mb-2 text-sm font-medium">{t('issue.detail.activity')}</h3>
                  <ActivityFeed activities={activities.data ?? []} />
                </div>

                <div className="mb-4">
                  <h3 className="mb-2 text-sm font-medium">{t('issue.detail.comments')}</h3>
                  <CommentList comments={comments.data ?? []} />
                </div>

                <CommentForm issueId={issueId} />

                <button
                  type="button"
                  onClick={() => {
                    // See signup-form.tsx: a per-call onSuccess passed to
                    // mutate()/mutateAsync() can be silently dropped under
                    // StrictMode — await the promise directly instead.
                    void deleteIssue.mutateAsync(issueId).then(onClose)
                  }}
                  className="mt-6 self-start text-xs text-red-500 hover:underline"
                >
                  {t('issue.detail.delete')}
                </button>
              </>
            )}
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
