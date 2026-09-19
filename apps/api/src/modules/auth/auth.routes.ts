import { loginSchema, signupSchema } from '@lynx/types'
import type { FastifyPluginAsync, FastifyReply } from 'fastify'

import { env } from '../../env'
import { ConflictError, UnauthorizedError } from '../../lib/errors'
import { toPublicUser } from '../users/users.mapper'
import {
  createSession,
  createUser,
  findUserByEmail,
  revokeSessionByToken,
  rotateSession,
  verifyPassword,
} from './auth.service'

const REFRESH_COOKIE_NAME = 'lynx_refresh_token'
const REFRESH_COOKIE_PATH = '/auth'

function getUserAgent(request: { headers: { 'user-agent'?: string } }) {
  return request.headers['user-agent']
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  function setRefreshCookie(reply: FastifyReply, token: string, expires: Date) {
    reply.setCookie(REFRESH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: REFRESH_COOKIE_PATH,
      expires,
    })
  }

  app.post('/auth/signup', async (request, reply) => {
    const body = signupSchema.parse(request.body)

    const existing = await findUserByEmail(body.email)
    if (existing) throw new ConflictError('An account with this email already exists')

    const user = await createUser(body)
    const accessToken = app.jwt.sign({ sub: user.id, email: user.email })
    const { refreshToken, expiresAt } = await createSession(user.id, getUserAgent(request))

    setRefreshCookie(reply, refreshToken, expiresAt)
    return reply.code(201).send({ user: toPublicUser(user), accessToken })
  })

  app.post('/auth/login', async (request, reply) => {
    const body = loginSchema.parse(request.body)

    const user = await findUserByEmail(body.email)
    if (!user?.passwordHash || !(await verifyPassword(user.passwordHash, body.password))) {
      throw new UnauthorizedError('Invalid email or password')
    }

    const accessToken = app.jwt.sign({ sub: user.id, email: user.email })
    const { refreshToken, expiresAt } = await createSession(user.id, getUserAgent(request))

    setRefreshCookie(reply, refreshToken, expiresAt)
    return { user: toPublicUser(user), accessToken }
  })

  app.post('/auth/refresh', async (request, reply) => {
    const refreshToken: string | undefined = request.cookies[REFRESH_COOKIE_NAME]
    if (!refreshToken) throw new UnauthorizedError('Missing refresh token')

    const rotated = await rotateSession(refreshToken, getUserAgent(request))
    if (!rotated) {
      reply.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH })
      throw new UnauthorizedError('Invalid or expired refresh token')
    }

    const accessToken = app.jwt.sign({ sub: rotated.user.id, email: rotated.user.email })
    setRefreshCookie(reply, rotated.refreshToken, rotated.expiresAt)
    return { accessToken }
  })

  app.post('/auth/logout', async (request, reply) => {
    const refreshToken: string | undefined = request.cookies[REFRESH_COOKIE_NAME]
    if (refreshToken) await revokeSessionByToken(refreshToken)

    reply.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH })
    return reply.code(204).send()
  })
}
