import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { UnauthorizedException } from '@nestjs/common'
import { AuthGuard } from '../auth.guard'

describe('AuthGuard', () => {
  let guard: AuthGuard
  let jwtService: { verifyAsync: ReturnType<typeof mock> }
  let userService: { getUserById: ReturnType<typeof mock> }

  const createContext = (request: Record<string, unknown>) =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
    }) as any

  beforeEach(() => {
    jwtService = { verifyAsync: mock(() => Promise.resolve({ id: 'user-1' })) }
    userService = { getUserById: mock(() => Promise.resolve({ id: 'user-1' })) }
    guard = new AuthGuard(jwtService as any, userService as any)
  })

  it('attaches the user to the request for a valid token', async () => {
    const request = { cookies: { token: 'jwt' }, method: 'GET', url: '/api/me' }

    const result = await guard.canActivate(createContext(request))

    expect(result).toBe(true)
    expect(userService.getUserById).toHaveBeenCalledWith('user-1')
    expect((request as any).user).toEqual({ id: 'user-1' })
  })

  it('throws UnauthorizedException when the token user no longer exists', async () => {
    userService.getUserById = mock(() => Promise.resolve(null))
    const request = { cookies: { token: 'jwt' }, method: 'GET', url: '/api/me' }

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(UnauthorizedException)
    expect((request as any).user).toBeUndefined()
  })
})
