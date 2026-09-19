import { createHash, randomBytes } from 'node:crypto'

import argon2 from 'argon2'
import { and, eq, isNull } from 'drizzle-orm'

import { db } from '../../db/client'
import { sessions, users } from '../../db/schema'
import { env } from '../../env'

export async function hashPassword(password: string) {
  return argon2.hash(password)
}

export async function verifyPassword(hash: string, password: string) {
  return argon2.verify(hash, password)
}

export function generateRefreshToken() {
  return randomBytes(48).toString('hex')
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function createUser(input: { name: string; email: string; password: string }) {
  const passwordHash = await hashPassword(input.password)
  const [user] = await db
    .insert(users)
    .values({ name: input.name, email: input.email, passwordHash })
    .returning()
  if (!user) throw new Error('Failed to create user')
  return user
}

export async function findUserByEmail(email: string) {
  return db.query.users.findFirst({ where: eq(users.email, email) })
}

export async function createSession(userId: string, userAgent: string | undefined) {
  const refreshToken = generateRefreshToken()
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)

  await db.insert(sessions).values({
    userId,
    refreshTokenHash: hashToken(refreshToken),
    userAgent,
    expiresAt,
  })

  return { refreshToken, expiresAt }
}

export async function rotateSession(refreshToken: string, userAgent: string | undefined) {
  const tokenHash = hashToken(refreshToken)
  const session = await db.query.sessions.findFirst({
    where: and(eq(sessions.refreshTokenHash, tokenHash), isNull(sessions.revokedAt)),
    with: { user: true },
  })

  if (!session || session.expiresAt < new Date()) return null

  await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, session.id))
  const next = await createSession(session.userId, userAgent)

  return { user: session.user, ...next }
}

export async function revokeSessionByToken(refreshToken: string) {
  const tokenHash = hashToken(refreshToken)
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.refreshTokenHash, tokenHash), isNull(sessions.revokedAt)))
}
