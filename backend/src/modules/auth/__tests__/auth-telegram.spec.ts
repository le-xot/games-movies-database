import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { jwtVerify } from 'jose'
import { HttpException } from '@/utils/errors'
import { AuthService } from '../auth.service'

const JWT_SECRET = 'test-secret'

describe('AuthService telegram oidc', () => {
  let service: AuthService
  let userService: Record<string, ReturnType<typeof mock>>

  const profile = {
    id: '42',
    username: 'ivan',
    firstName: 'Ivan',
    photoUrl: 'https://cdn4.telesco.pe/file/photo.jpg',
  }

  beforeEach(() => {
    userService = {
      getUserById: mock(() => Promise.resolve({ id: 'user-1' })),
      upsertUser: mock(() => Promise.resolve({ id: 'user-1' })),
      getUserByPlatformId: mock(() => Promise.resolve({ id: 'user-1' })),
      getLinkedAccounts: mock(() => Promise.resolve([])),
      linkPlatformAccount: mock(() => Promise.resolve()),
    }
    service = new AuthService(JWT_SECRET, userService as any, {} as any, {} as any)
  })

  it('creates a user and returns a jwt on login', async () => {
    const jwt = await service.handleTelegramOidcLogin(profile)
    const { payload } = await jwtVerify(jwt, new TextEncoder().encode(JWT_SECRET))

    expect(payload['id']).toBe('user-1')
    expect(userService.upsertUser).toHaveBeenCalledWith(
      '42',
      { login: 'ivan', platformAvatar: 'https://cdn4.telesco.pe/file/photo.jpg' },
      'TELEGRAM',
    )
  })

  it('does not use the telegram photo for the profile avatar', async () => {
    await service.handleTelegramOidcLogin({ id: '7', firstName: 'Ivan' })

    expect(userService.upsertUser).toHaveBeenCalledWith(
      '7',
      { login: 'Ivan', platformAvatar: undefined },
      'TELEGRAM',
    )
  })

  it('links the telegram account to the current user', async () => {
    await service.linkTelegramOidc('user-1', profile)

    expect(userService.linkPlatformAccount).toHaveBeenCalledWith('user-1', {
      platform: 'TELEGRAM',
      platformUserId: '42',
      platformLogin: 'ivan',
      platformAvatar: 'https://cdn4.telesco.pe/file/photo.jpg',
    })
  })

  it('rejects linking when telegram is already linked', async () => {
    userService.getLinkedAccounts = mock(() => Promise.resolve([{ platform: 'TELEGRAM' }]))

    await expect(service.linkTelegramOidc('user-1', profile)).rejects.toThrow(HttpException)
  })
})
