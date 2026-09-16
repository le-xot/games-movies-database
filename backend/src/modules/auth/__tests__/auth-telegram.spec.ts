import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { HttpException } from '@nestjs/common'
import { AuthService } from '../auth.service'

describe('AuthService telegram oidc', () => {
  let service: AuthService
  let jwtService: { signAsync: ReturnType<typeof mock> }
  let userService: Record<string, ReturnType<typeof mock>>

  const profile = {
    id: '42',
    username: 'ivan',
    firstName: 'Ivan',
    photoUrl: 'https://cdn4.telesco.pe/file/photo.jpg',
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
    service = new AuthService(jwtService as any, userService as any, {} as any, {} as any)
  })

  it('creates a user and returns a jwt on login', async () => {
    const jwt = await service.handleTelegramOidcLogin(profile)

    expect(jwt).toBe('jwt-token')
    expect(userService.upsertUser).toHaveBeenCalledWith(
      '42',
      { login: 'ivan', profileImageUrl: 'https://cdn4.telesco.pe/file/photo.jpg' },
      'TELEGRAM',
    )
  })

  it('uses an empty avatar when the picture is missing', async () => {
    await service.handleTelegramOidcLogin({ id: '7', firstName: 'Ivan' })

    expect(userService.upsertUser).toHaveBeenCalledWith(
      '7',
      { login: 'Ivan', profileImageUrl: '' },
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
