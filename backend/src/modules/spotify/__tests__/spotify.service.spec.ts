import { beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'

mock.module('../../../utils/enviroments', () => ({
  env: {
    SPOTIFY_CLIENT_ID: 'test-client-id',
    SPOTIFY_CLIENT_SECRET: 'test-client-secret',
    SPOTIFY_CALLBACK_URL: 'http://localhost:5173/auth/callback/spotify',
  },
}))

import { createMock } from '@/__tests__/helpers/mock-factory'
import { ThirdPartService } from '@/enums'
import type { SpotifyTokenDomain } from '../entities/spotify-token.entity'
import { SpotifyTokenRepository } from '../repositories/spotify-token.repository'
import { SpotifyService } from '../spotify.service'

const mockToken: SpotifyTokenDomain = {
  id: 1,
  service: ThirdPartService.SPOTIFY,
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  obtainedAt: new Date('2026-01-01'),
  expiresAt: new Date('2026-01-02'),
}

describe('SpotifyService', () => {
  let service: SpotifyService
  let mockRepo: SpotifyTokenRepository

  beforeEach(() => {
    mockRepo = createMock(SpotifyTokenRepository)
    service = new SpotifyService(mockRepo)
  })

  describe('onApplicationBootstrap', () => {
    it('creates a Spotify client when token exists', async () => {
      mockRepo.findByService = mock(() => Promise.resolve(mockToken))

      await service.onApplicationBootstrap()

      expect(mockRepo.findByService).toHaveBeenCalledWith(ThirdPartService.SPOTIFY)
      expect(service.client).not.toBeNull()
    })

    it('leaves client null when no token exists', async () => {
      mockRepo.findByService = mock(() => Promise.resolve(null))

      await service.onApplicationBootstrap()

      expect(mockRepo.findByService).toHaveBeenCalledWith(ThirdPartService.SPOTIFY)
      expect(service.client).toBeNull()
    })
  })

  describe('authorize', () => {
    it('calls repository.upsert with correct token data and sets client', async () => {
      const code = 'auth-code'
      const tokenResponse = {
        access_token: 'new-access',
        refresh_token: 'new-refresh',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'user-read-playback-state',
      }
      const fetchMock = mock(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(tokenResponse),
        }),
      )
      spyOn(globalThis, 'fetch').mockImplementation(fetchMock as any)

      mockRepo.upsert = mock(() => Promise.resolve(mockToken))

      await service.authorize(code)

      expect(mockRepo.upsert).toHaveBeenCalledTimes(1)
      const [calledService, calledData] = (mockRepo.upsert as ReturnType<typeof mock>).mock.calls[0]
      expect(calledService).toBe(ThirdPartService.SPOTIFY)
      expect(calledData.accessToken).toBe('new-access')
      expect(calledData.refreshToken).toBe('new-refresh')
      expect(service.client).not.toBeNull()
    })

    it('throws InternalServerErrorException when fetch fails', async () => {
      spyOn(globalThis, 'fetch').mockImplementation(
        mock(() =>
          Promise.resolve({
            ok: false,
            text: () => Promise.resolve('Bad credentials'),
          }),
        ) as any,
      )

      await expect(service.authorize('bad-code')).rejects.toThrow()
    })
  })

  describe('refreshTokens (via client refresher)', () => {
    it('calls repository.findByService and repository.update, returns new tokens', async () => {
      const tokenResponse = {
        access_token: 'refreshed-access',
        refresh_token: 'refreshed-refresh',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'user-read-playback-state',
      }
      const fetchMock = mock(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(tokenResponse),
        }),
      )
      spyOn(globalThis, 'fetch').mockImplementation(fetchMock as any)

      mockRepo.findByService = mock(() => Promise.resolve(mockToken))
      mockRepo.update = mock(() =>
        Promise.resolve({
          ...mockToken,
          accessToken: 'refreshed-access',
          refreshToken: 'refreshed-refresh',
        }),
      )

      const result = await (service as any).refreshTokens()

      expect(mockRepo.findByService).toHaveBeenCalledWith(ThirdPartService.SPOTIFY)
      expect(mockRepo.update).toHaveBeenCalledTimes(1)
      const [calledService, calledData] = (mockRepo.update as ReturnType<typeof mock>).mock.calls[0]
      expect(calledService).toBe(ThirdPartService.SPOTIFY)
      expect(calledData.accessToken).toBe('refreshed-access')
      expect(calledData.refreshToken).toBe('refreshed-refresh')
      expect(result.accessToken).toBe('refreshed-access')
      expect(result.refreshToken).toBe('refreshed-refresh')
    })

    it('throws when no token exists in DB', async () => {
      mockRepo.findByService = mock(() => Promise.resolve(null))

      await expect((service as any).refreshTokens()).rejects.toThrow('Spotify tokens not created')
    })

    it('throws when fetch fails during refresh', async () => {
      mockRepo.findByService = mock(() => Promise.resolve(mockToken))
      spyOn(globalThis, 'fetch').mockImplementation(
        mock(() =>
          Promise.resolve({
            ok: false,
            text: () => Promise.resolve('Refresh failed'),
          }),
        ) as any,
      )

      await expect((service as any).refreshTokens()).rejects.toThrow('Cannot refresh tokens')
    })
  })

  describe('createAuthorizationUrl', () => {
    it('returns a valid Spotify authorization URL', () => {
      const url = service.createAuthorizationUrl()

      expect(url).toContain('https://accounts.spotify.com/authorize')
      expect(url).toContain('response_type=code')
      expect(url).toContain('user-modify-playback-state')
    })
  })
})
