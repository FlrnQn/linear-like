import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { buildTestApp, signupUser } from '../../../test/helpers'

describe('auth', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await buildTestApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('signs up a new user and returns an access token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: { name: 'Ada Lovelace', email: 'ada@example.com', password: 'password123' },
    })

    expect(response.statusCode).toBe(201)
    const body = response.json() as { user: { email: string }; accessToken: string }
    expect(body.user.email).toBe('ada@example.com')
    expect(body.accessToken).toBeTruthy()
  })

  it('rejects signup with an email that already exists', async () => {
    await signupUser(app, { email: 'dupe@example.com' })

    const response = await app.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: { name: 'Someone Else', email: 'dupe@example.com', password: 'password123' },
    })

    expect(response.statusCode).toBe(409)
  })

  it('logs in with correct credentials', async () => {
    await signupUser(app, { email: 'login-ok@example.com', password: 'correct-password' })

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'login-ok@example.com', password: 'correct-password' },
    })

    expect(response.statusCode).toBe(200)
    expect((response.json() as { accessToken: string }).accessToken).toBeTruthy()
  })

  it('rejects login with the wrong password', async () => {
    await signupUser(app, { email: 'login-bad@example.com', password: 'correct-password' })

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'login-bad@example.com', password: 'wrong-password' },
    })

    expect(response.statusCode).toBe(401)
  })

  it('rotates the refresh token and issues a new access token', async () => {
    const signupResponse = await app.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: { name: 'Refresh Test', email: 'refresh@example.com', password: 'password123' },
    })
    const cookie = signupResponse.cookies.find((c) => c.name === 'lynx_refresh_token')
    expect(cookie).toBeTruthy()

    const refreshResponse = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      cookies: { lynx_refresh_token: cookie?.value ?? '' },
    })

    expect(refreshResponse.statusCode).toBe(200)
    expect((refreshResponse.json() as { accessToken: string }).accessToken).toBeTruthy()
    // Rotation revokes the old token — reusing it must fail.
    const reuseResponse = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      cookies: { lynx_refresh_token: cookie?.value ?? '' },
    })
    expect(reuseResponse.statusCode).toBe(401)
  })

  it('logs out and clears the refresh cookie', async () => {
    const signupResponse = await app.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: { name: 'Logout Test', email: 'logout@example.com', password: 'password123' },
    })
    const cookie = signupResponse.cookies.find((c) => c.name === 'lynx_refresh_token')

    const logoutResponse = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      cookies: { lynx_refresh_token: cookie?.value ?? '' },
    })
    expect(logoutResponse.statusCode).toBe(204)

    const refreshAfterLogout = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      cookies: { lynx_refresh_token: cookie?.value ?? '' },
    })
    expect(refreshAfterLogout.statusCode).toBe(401)
  })
})
