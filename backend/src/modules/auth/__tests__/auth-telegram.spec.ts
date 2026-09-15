import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { ForbiddenException, HttpException } from '@nestjs/common'
import { AuthService } from '../auth.service'

describe('AuthService telegram auth', () => {
  let service: AuthService
  let jwtService: { signAsync: ReturnType<typeof mock> }
  let userService: Record<string, ReturnType<typeof mock>>
  let telegram: Record<string, ReturnType<typeof mock>>

  const profile = {
    id: '42',
    username: 'ivan',
    firstName: 'Ivan',
    photoUrl: 'https://api.telegram.org/file/bot123/photo.jpg',
  }

  beforeEach(() => {
    jwtService = { signAsync: mock(() => Promise.resolve('jwt-token')) }
    userService = {
      getUserById: mock(() => Promise.resolve({ id: 'user-1' })),
      upsertUser: mock(() => Promise.resolve({ id: 'user-1' })),
      getUserByPlatformId: mock(() => Promise.resolve({ id: 'user-1' })),
      getLinkedAccounts: mock(() => Promise.resolve([])),
      linkPlatformAccount: mock(() => Promise.resolve()),
    }
    telegram = {
      assertConfigured: mock(() => {}),
      createAuthToken: mock(() => Promise.resolve('token-1')),
      buildStartLink: mock((token: string) => `https://t.me/gmd_bot?start=${token}`),
      getAuthToken: mock(() => Promise.resolve(null)),
      consumeAuthToken: mock(() => Promise.resolve(null)),
    }
    service = new AuthService(
      jwtService as any,
      userService as any,
      {} as any,
      {} as any,
      telegram as any,
    )
  })

  it('starts login auth with a deep link', async () => {
    const result = await service.startTelegramAuth('login')

    expect(result).toEqual({ token: 'token-1', url: 'https://t.me/gmd_bot?start=token-1' })
    expect(telegram.createAuthToken).toHaveBeenCalledWith('login', undefined, undefined)
  })

  it('forwards the origin to the auth token', async () => {
    await service.startTelegramAuth('link', 'user-1', 'https://le-xot.dev')

    expect(telegram.createAuthToken).toHaveBeenCalledWith('link', 'user-1', 'https://le-xot.dev')
  })

  it('returns pending while the bot has not confirmed the token', async () => {
    telegram.getAuthToken = mock(() =>
      Promise.resolve({ status: 'pending', mode: 'login', createdAt: 1 }),
    )

    expect(await service.pollTelegramLogin('token-1')).toEqual({ status: 'pending' })
    expect(telegram.consumeAuthToken).not.toHaveBeenCalled()
  })

  it('creates a user and returns a jwt on successful login', async () => {
    telegram.getAuthToken = mock(() =>
      Promise.resolve({ status: 'confirmed', mode: 'login', profile, createdAt: 1 }),
    )
    telegram.consumeAuthToken = mock(() =>
      Promise.resolve({ status: 'confirmed', mode: 'login', profile, createdAt: 1 }),
    )

    const result = await service.pollTelegramLogin('token-1')

    expect(result).toEqual({ status: 'ok', jwt: 'jwt-token' })
    expect(userService.upsertUser).toHaveBeenCalledWith(
      '42',
      { login: 'ivan', profileImageUrl: 'https://api.telegram.org/file/bot123/photo.jpg' },
      'TELEGRAM',
    )
  })

  it('falls back to tg_<id> when the profile has no name or username', async () => {
    const anonymous = { id: '77', firstName: '' }
    telegram.getAuthToken = mock(() =>
      Promise.resolve({ status: 'confirmed', mode: 'login', profile: anonymous, createdAt: 1 }),
    )
    telegram.consumeAuthToken = mock(() =>
      Promise.resolve({ status: 'confirmed', mode: 'login', profile: anonymous, createdAt: 1 }),
    )

    await service.pollTelegramLogin('token-1')

    expect(userService.upsertUser).toHaveBeenCalledWith(
      '77',
      { login: 'tg_77', profileImageUrl: '' },
      'TELEGRAM',
    )
  })

  it('throws 410 for an expired login token', async () => {
    await expect(service.pollTelegramLogin('missing')).rejects.toThrow(HttpException)
  })

  it('throws 400 when the auth cookie is missing', async () => {
    await expect(service.pollTelegramLogin(undefined)).rejects.toThrow(HttpException)
  })

  it('links the telegram account to the current user', async () => {
    const record = { status: 'confirmed', mode: 'link', userId: 'user-1', profile, createdAt: 1 }
    telegram.getAuthToken = mock(() => Promise.resolve(record))
    telegram.consumeAuthToken = mock(() => Promise.resolve(record))

    const result = await service.pollTelegramLink('token-1', 'user-1')

    expect(result).toEqual({ status: 'ok' })
    expect(userService.linkPlatformAccount).toHaveBeenCalledWith('user-1', {
      platform: 'TELEGRAM',
      platformUserId: '42',
      platformLogin: 'ivan',
      platformAvatar: 'https://api.telegram.org/file/bot123/photo.jpg',
    })
  })

  it('rejects a link token that belongs to another session', async () => {
    const record = { status: 'confirmed', mode: 'link', userId: 'other', profile, createdAt: 1 }
    telegram.getAuthToken = mock(() => Promise.resolve(record))
    telegram.consumeAuthToken = mock(() => Promise.resolve(record))

    await expect(service.pollTelegramLink('token-1', 'user-1')).rejects.toThrow(ForbiddenException)
  })

  it('rejects linking when telegram is already linked', async () => {
    const record = { status: 'confirmed', mode: 'link', userId: 'user-1', profile, createdAt: 1 }
    userService.getLinkedAccounts = mock(() => Promise.resolve([{ platform: 'TELEGRAM' }]))
    telegram.getAuthToken = mock(() => Promise.resolve(record))
    telegram.consumeAuthToken = mock(() => Promise.resolve(record))

    await expect(service.pollTelegramLink('token-1', 'user-1')).rejects.toThrow(HttpException)
  })
})
