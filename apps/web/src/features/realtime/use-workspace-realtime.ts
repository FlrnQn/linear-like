import type { Comment, Issue } from '@lynx/types'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

import { activitiesQueryKey } from '@/features/activities/use-activities'
import { commentsQueryKey } from '@/features/comments/use-comments'
import { mapCachedIssues } from '@/features/issues/issues-cache'
import { issueQueryKey } from '@/features/issues/use-issue'
import { projectsQueryKey } from '@/features/projects/use-projects'
import { i18n } from '@/i18n'
import { API_URL } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { useToastStore } from '@/stores/toast-store'

type IncomingEvent =
  | { type: 'issue.created'; workspaceId: string; actorId: string; issue: Issue }
  | { type: 'issue.updated'; workspaceId: string; actorId: string; issue: Issue }
  | { type: 'issue.deleted'; workspaceId: string; actorId: string; issueId: string }
  | { type: 'comment.created'; workspaceId: string; actorId: string; comment: Comment }
  | { type: 'project.updated'; workspaceId: string; actorId: string }
  | { type: 'subscribed'; workspaceId: string }
  | { type: 'error'; message: string }

const RECONNECT_DELAY_MS = 2000

export function useWorkspaceRealtime(workspaceId: string | undefined) {
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((state) => state.accessToken)
  const currentUserId = useAuthStore((state) => state.user?.id)
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!workspaceId || !accessToken) return

    let stopped = false
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined

    function handleEvent(event: IncomingEvent) {
      const isSelf = 'actorId' in event && event.actorId === currentUserId

      switch (event.type) {
        case 'issue.created': {
          void queryClient.invalidateQueries({ queryKey: ['issues'] })
          if (!isSelf) {
            useToastStore
              .getState()
              .push(i18n.t('realtime.issueCreated', { identifier: event.issue.identifier }))
          }
          break
        }
        case 'issue.updated': {
          queryClient.setQueryData(issueQueryKey(event.issue.id), event.issue)
          queryClient
            .getQueryCache()
            .findAll({ queryKey: ['issues'] })
            .forEach((query) => {
              if (query.state.data) {
                queryClient.setQueryData(
                  query.queryKey,
                  mapCachedIssues(query.state.data, (issue) =>
                    issue.id === event.issue.id ? event.issue : issue,
                  ),
                )
              }
            })
          void queryClient.invalidateQueries({ queryKey: activitiesQueryKey(event.issue.id) })
          if (!isSelf) {
            useToastStore
              .getState()
              .push(i18n.t('realtime.issueUpdated', { identifier: event.issue.identifier }))
          }
          break
        }
        case 'issue.deleted': {
          queryClient.removeQueries({ queryKey: issueQueryKey(event.issueId) })
          void queryClient.invalidateQueries({ queryKey: ['issues'] })
          if (!isSelf) useToastStore.getState().push(i18n.t('realtime.issueDeletedToast'))
          break
        }
        case 'comment.created': {
          void queryClient.invalidateQueries({ queryKey: commentsQueryKey(event.comment.issueId) })
          void queryClient.invalidateQueries({
            queryKey: activitiesQueryKey(event.comment.issueId),
          })
          if (!isSelf) useToastStore.getState().push(i18n.t('realtime.commentPosted'))
          break
        }
        case 'project.updated': {
          void queryClient.invalidateQueries({ queryKey: projectsQueryKey(event.workspaceId) })
          break
        }
        default:
          break
      }
    }

    function connect() {
      const wsUrl = `${API_URL.replace(/^http/, 'ws')}/ws?token=${encodeURIComponent(accessToken ?? '')}`
      const socket = new WebSocket(wsUrl)
      socketRef.current = socket

      socket.addEventListener('open', () => {
        socket.send(JSON.stringify({ type: 'subscribe', workspaceId }))
      })

      socket.addEventListener('message', (message) => {
        try {
          handleEvent(JSON.parse(message.data as string) as IncomingEvent)
        } catch {
          // ignore malformed frames
        }
      })

      socket.addEventListener('close', () => {
        if (!stopped) reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS)
      })
    }

    connect()

    return () => {
      stopped = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [workspaceId, accessToken, currentUserId, queryClient])
}
