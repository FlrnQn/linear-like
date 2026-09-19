import websocketPlugin from '@fastify/websocket'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import type { WebSocket } from 'ws'
import { z } from 'zod'

import { redis } from '../db/redis'
import { requireWorkspaceRole } from '../middleware/require-workspace-role'
import type { WorkspaceEvent } from './events'
import { WORKSPACE_EVENTS_CHANNEL } from './events'

const subscribeMessageSchema = z.object({
  type: z.literal('subscribe'),
  workspaceId: z.string().uuid(),
})

export async function registerWebsocket(app: FastifyInstance) {
  await app.register(websocketPlugin)

  const socketsByWorkspace = new Map<string, Set<WebSocket>>()

  function addSocket(workspaceId: string, socket: WebSocket) {
    let sockets = socketsByWorkspace.get(workspaceId)
    if (!sockets) {
      sockets = new Set()
      socketsByWorkspace.set(workspaceId, sockets)
    }
    sockets.add(socket)
  }

  function removeSocket(workspaceId: string, socket: WebSocket) {
    const sockets = socketsByWorkspace.get(workspaceId)
    sockets?.delete(socket)
    if (sockets && sockets.size === 0) socketsByWorkspace.delete(workspaceId)
  }

  // A subscribed ioredis connection can't run other commands, so it must be
  // a dedicated duplicate of the main client (which keeps doing health-check
  // pings and, from other request handlers, publish()).
  const subscriber = redis.duplicate()
  subscriber.on('error', () => {})
  await subscriber.subscribe(WORKSPACE_EVENTS_CHANNEL).catch(() => {})

  subscriber.on('message', (_channel, message) => {
    let event: WorkspaceEvent
    try {
      event = JSON.parse(message) as WorkspaceEvent
    } catch {
      return
    }

    const sockets = socketsByWorkspace.get(event.workspaceId)
    if (!sockets || sockets.size === 0) return

    const payload = JSON.stringify(event)
    for (const socket of sockets) {
      if (socket.readyState === socket.OPEN) socket.send(payload)
    }
  })

  app.get('/ws', { websocket: true }, (socket, request: FastifyRequest) => {
    const { token } = request.query as { token?: string }

    let userId: string
    try {
      if (!token) throw new Error('Missing token')
      const payload = app.jwt.verify(token) as { sub: string }
      userId = payload.sub
    } catch {
      socket.close(1008, 'Unauthorized')
      return
    }

    let joinedWorkspaceId: string | null = null

    socket.on('message', (raw: Buffer) => {
      void (async () => {
        let parsed: unknown
        try {
          parsed = JSON.parse(raw.toString())
        } catch {
          return
        }

        const result = subscribeMessageSchema.safeParse(parsed)
        if (!result.success) return

        try {
          await requireWorkspaceRole(userId, result.data.workspaceId, [
            'OWNER',
            'ADMIN',
            'MEMBER',
            'GUEST',
          ])
        } catch {
          socket.send(JSON.stringify({ type: 'error', message: 'Not a member of this workspace' }))
          return
        }

        if (joinedWorkspaceId) removeSocket(joinedWorkspaceId, socket)
        joinedWorkspaceId = result.data.workspaceId
        addSocket(joinedWorkspaceId, socket)
        socket.send(JSON.stringify({ type: 'subscribed', workspaceId: joinedWorkspaceId }))
      })()
    })

    socket.on('close', () => {
      if (joinedWorkspaceId) removeSocket(joinedWorkspaceId, socket)
    })
  })
}
