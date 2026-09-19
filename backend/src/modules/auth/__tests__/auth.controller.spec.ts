import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { BadRequestException } from '@nestjs/common'
import { AuthController } from '../auth.controller'

const makeResponse = () => {
  const res: any = {
    cookie: mock(() => res),
    clearCookie: mock(() => res),
    redirect: mock(() => res),
    status: mock(() => res),
    send: mock(() => res),
    json: mock(() => res),
    end: mock(() => res),
  }
  return res
}

const makeRequest = (cookies: Record<string, string> = {}) => ({ cookies }) as any

describe('AuthController OAuth state', () => {
  let controller: AuthController
  let authService: any
  let userService: any
  let twitch: any
  let telegram: any
  let jwtService: any

  beforeEach(() => {
    authService = {
      handleTwitchCallback: mock(() => Promise.resolve('token')),
      handleKickCallback: mock(() => Promise.resolve('token')),
      linkTwitchAccount: mock(() => Promise.resolve()),
      linkKickAccount: mock(() => Promise.resolve()),
      handleTelegramOidcLogin: mock(() => Promise.resolve('token')),
      linkTelegramOidc: mock(() => Promise.resolve()),
    }
    userService = {
      getLinkedAccounts: mock(() => Promise.resolve([])),
      unlinkPlatformAccount: mock(() => Promise.resolve()),
      deleteUserById: mock(() => Promise.resolve()),
      updateLogin: mock(() => Promise.resolve()),
    }
    twitch = {}
    telegram = { createAuthorizationRequest: mock() }
    jwtService = { verifyAsync: mock() }
    controller = new AuthController(authService, userService, twitch, telegram, jwtService)
  })

  describe('twitch', () => {
    it('stores a state cookie and uses the same state in the auth url', () => {
      const res = makeResponse()

      controller.twitchAuth(res)

      const stateCookie = res.cookie.mock.calls.find(([name]: [string]) => name === 'twitch_state')
      expect(stateCookie).toBeDefined()
      expect(stateCookie[2]).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/' })

      const [redirectUrl] = res.redirect.mock.calls[0]
      expect(new URL(redirectUrl).searchParams.get('state')).toBe(stateCookie[1])
    })

    it('rejects a twitch callback without the state cookie', async () => {
      await expect(
        controller.twitchAuthCallback(
          { code: 'code', state: 'state' },
          makeRequest(),
          makeResponse(),
        ),
      ).rejects.toThrow(BadRequestException)
      expect(authService.handleTwitchCallback).not.toHaveBeenCalled()
    })

    it('rejects a twitch callback with a mismatched state', async () => {
      await expect(
        controller.twitchAuthCallback(
          { code: 'code', state: 'other' },
          makeRequest({ twitch_state: 'state' }),
          makeResponse(),
        ),
      ).rejects.toThrow(BadRequestException)
      expect(authService.handleTwitchCallback).not.toHaveBeenCalled()
    })

    it('accepts a twitch callback with a matching state and sets the auth cookie', async () => {
      const res = makeResponse()

      await controller.twitchAuthCallback(
        { code: 'code', state: 'state' },
        makeRequest({ twitch_state: 'state' }),
        res,
      )

      expect(authService.handleTwitchCallback).toHaveBeenCalledWith('code')
      expect(res.cookie).toHaveBeenCalledWith(
        'token',
        'token',
        expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' }),
      )
      expect(res.status).toHaveBeenCalledWith(200)
    })
  })

  describe('kick', () => {
    it('rejects a kick callback without the state cookie', async () => {
      await expect(
        controller.kickAuthCallback(
          { code: 'code', state: 'state' },
          makeRequest({ kick_code_verifier: 'verifier' }),
          makeResponse(),
        ),
      ).rejects.toThrow(BadRequestException)
      expect(authService.handleKickCallback).not.toHaveBeenCalled()
    })

    it('rejects a kick callback without the pkce verifier', async () => {
      await expect(
        controller.kickAuthCallback(
          { code: 'code', state: 'state' },
          makeRequest({ kick_state: 'state' }),
          makeResponse(),
        ),
      ).rejects.toThrow(BadRequestException)
      expect(authService.handleKickCallback).not.toHaveBeenCalled()
    })

    it('accepts a kick callback with matching state and verifier', async () => {
      const res = makeResponse()

      await controller.kickAuthCallback(
        { code: 'code', state: 'state' },
        makeRequest({ kick_code_verifier: 'verifier', kick_state: 'state' }),
        res,
      )

      expect(authService.handleKickCallback).toHaveBeenCalledWith('code', 'verifier')
      expect(res.cookie).toHaveBeenCalledWith(
        'token',
        'token',
        expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' }),
      )
    })
  })
})
