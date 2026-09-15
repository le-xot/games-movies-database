import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { NotFoundException } from '@nestjs/common'
import { createMock } from '@/__tests__/helpers/mock-factory'
import { UserRole } from '@/enums'
import { UserDomain } from '../entities/user-domain.entity'
import { DrizzleUserRepository } from '../repositories/drizzle-user.repository'
import { UserService } from '../user.service'

describe('UserService', () => {
  let service: UserService
  let mockRepo: DrizzleUserRepository
  let mockEventEmitter: { emit: ReturnType<typeof mock> }
  let mockAvatarService: {
    fetchAndStoreOAuthAvatar: ReturnType<typeof mock>
    processAndStoreAvatar: ReturnType<typeof mock>
    deleteAvatarFromS3: ReturnType<typeof mock>
  }

  beforeEach(() => {
    mockRepo = createMock(DrizzleUserRepository)
    mockEventEmitter = { emit: mock(() => {}) }
    mockAvatarService = {
      fetchAndStoreOAuthAvatar: mock(() => Promise.resolve(null)),
      processAndStoreAvatar: mock(() => Promise.resolve('avatars/test.webp')),
      deleteAvatarFromS3: mock(() => Promise.resolve()),
    }
    service = new UserService(mockRepo, mockEventEmitter as any, mockAvatarService as any)
  })

  describe('upsertUser', () => {
    it('updates an existing user without custom avatar', async () => {
      const existingUser: UserDomain = {
        id: 'user-1',
        login: 'old-login',
        role: UserRole.USER,
        profileImageUrl: 'old-url',
        color: '#111111',
        hasCustomAvatar: false,
        createdAt: new Date('2024-01-01'),
      }
      const updatedUser: UserDomain = {
        ...existingUser,
        profileImageUrl: 'new-url',
      }
      const findByPlatformId = mock(() =>
        Promise.resolve(existingUser),
      ) as unknown as DrizzleUserRepository['findByPlatformId']
      const update = mock(() =>
        Promise.resolve(updatedUser),
      ) as unknown as DrizzleUserRepository['update']
      mockRepo.findByPlatformId = findByPlatformId
      mockRepo.update = update

      const result = await service.upsertUser(
        'user-1',
        {
          login: 'new-login',
          role: UserRole.ADMIN,
          profileImageUrl: 'new-url',
          color: '#222222',
        },
        'TWITCH',
      )

      expect(result).toEqual(updatedUser)
      expect(findByPlatformId).toHaveBeenCalledWith('TWITCH', 'user-1')
      expect(mockAvatarService.fetchAndStoreOAuthAvatar).toHaveBeenCalledWith('user-1', 'new-url')
    })

    it('skips profileImageUrl update when user has custom avatar', async () => {
      const existingUser: UserDomain = {
        id: 'user-1',
        login: 'old-login',
        role: UserRole.USER,
        profileImageUrl: 'custom-url',
        color: '#111111',
        hasCustomAvatar: true,
        createdAt: new Date('2024-01-01'),
      }
      const updatedUser: UserDomain = {
        ...existingUser,
        role: UserRole.ADMIN,
      }
      const findByPlatformId = mock(() =>
        Promise.resolve(existingUser),
      ) as unknown as DrizzleUserRepository['findByPlatformId']
      const update = mock(() =>
        Promise.resolve(updatedUser),
      ) as unknown as DrizzleUserRepository['update']
      mockRepo.findByPlatformId = findByPlatformId
      mockRepo.update = update

      const result = await service.upsertUser(
        'user-1',
        {
          login: 'new-login',
          role: UserRole.ADMIN,
          profileImageUrl: 'new-url',
          color: '#222222',
        },
        'TWITCH',
      )

      expect(result).toEqual(updatedUser)
      expect(update).toHaveBeenCalledWith('user-1', {
        role: UserRole.ADMIN,
        color: '#222222',
      })
      expect(mockAvatarService.fetchAndStoreOAuthAvatar).not.toHaveBeenCalled()
    })

    it('keeps the existing avatar when the oauth profile has no photo', async () => {
      const existingUser: UserDomain = {
        id: 'user-1',
        login: 'old-login',
        role: UserRole.USER,
        profileImageUrl: 'old-url',
        color: '#111111',
        hasCustomAvatar: false,
        createdAt: new Date('2024-01-01'),
      }
      const updatedUser: UserDomain = { ...existingUser }
      const findByPlatformId = mock(() =>
        Promise.resolve(existingUser),
      ) as unknown as DrizzleUserRepository['findByPlatformId']
      const update = mock(() =>
        Promise.resolve(updatedUser),
      ) as unknown as DrizzleUserRepository['update']
      mockRepo.findByPlatformId = findByPlatformId
      mockRepo.update = update

      await service.upsertUser('user-1', { login: 'tg-user', profileImageUrl: '' }, 'TELEGRAM')

      expect(update).toHaveBeenCalledWith('user-1', {
        role: undefined,
        profileImageUrl: 'old-url',
        color: undefined,
      })
      expect(mockAvatarService.fetchAndStoreOAuthAvatar).not.toHaveBeenCalled()
    })

    it('creates a user when no user exists', async () => {
      const createdUser: UserDomain = {
        id: 'user-2',
        login: 'new-user',
        role: UserRole.USER,
        profileImageUrl: 'new-url',
        color: '#333333',
        hasCustomAvatar: false,
        createdAt: new Date('2024-01-02'),
      }
      const findByPlatformId = mock(() =>
        Promise.resolve(null),
      ) as unknown as DrizzleUserRepository['findByPlatformId']
      const create = mock(() =>
        Promise.resolve(createdUser),
      ) as unknown as DrizzleUserRepository['create']
      mockRepo.findByPlatformId = findByPlatformId
      mockRepo.create = create

      const result = await service.upsertUser(
        'user-2',
        {
          login: 'new-user',
          role: UserRole.USER,
          profileImageUrl: 'new-url',
          color: '#333333',
        },
        'TWITCH',
      )

      expect(result).toEqual(createdUser)
      expect(findByPlatformId).toHaveBeenCalledWith('TWITCH', 'user-2')
      expect(mockAvatarService.fetchAndStoreOAuthAvatar).toHaveBeenCalledWith('user-2', 'new-url')
    })

    it('stores the oauth avatar under the created user id, not the platform id', async () => {
      const createdUser: UserDomain = {
        id: 'user-9',
        login: 'new-user',
        role: UserRole.USER,
        profileImageUrl: 'https://cdn.example.com/avatar.jpg',
        color: '#333333',
        hasCustomAvatar: false,
        createdAt: new Date('2024-01-09'),
      }
      const updatedUser: UserDomain = {
        ...createdUser,
        profileImageUrl: '/api/avatar/user-9?t=1',
      }
      mockRepo.findByPlatformId = mock(() =>
        Promise.resolve(null),
      ) as unknown as DrizzleUserRepository['findByPlatformId']
      mockRepo.create = mock(() =>
        Promise.resolve(createdUser),
      ) as unknown as DrizzleUserRepository['create']
      mockRepo.update = mock(() =>
        Promise.resolve(updatedUser),
      ) as unknown as DrizzleUserRepository['update']
      mockAvatarService.fetchAndStoreOAuthAvatar = mock(() =>
        Promise.resolve('/api/avatar/user-9?t=1'),
      )

      const result = await service.upsertUser(
        'twitch-platform-777',
        { login: 'new-user', profileImageUrl: 'https://cdn.example.com/avatar.jpg' },
        'TWITCH',
      )

      expect(mockAvatarService.fetchAndStoreOAuthAvatar).toHaveBeenCalledWith(
        'user-9',
        'https://cdn.example.com/avatar.jpg',
      )
      expect(mockRepo.update).toHaveBeenCalledWith('user-9', {
        profileImageUrl: '/api/avatar/user-9?t=1',
      })
      expect(result.profileImageUrl).toBe('/api/avatar/user-9?t=1')
    })
  })

  describe('getUserById', () => {
    it('delegates to repository.findById', async () => {
      const user: UserDomain = {
        id: 'user-5',
        login: 'login-5',
        role: UserRole.ADMIN,
        profileImageUrl: 'url',
        color: '#555555',
        hasCustomAvatar: false,
        createdAt: new Date('2024-01-06'),
      }
      const findById = mock(() =>
        Promise.resolve(user),
      ) as unknown as DrizzleUserRepository['findById']
      mockRepo.findById = findById

      const result = await service.getUserById('user-5')

      expect(result).toEqual(user)
      expect(findById).toHaveBeenCalledWith('user-5')
    })
  })

  describe('getAllUsers', () => {
    it('delegates to repository.findAll', async () => {
      const users: UserDomain[] = [
        {
          id: 'user-6',
          login: 'login-6',
          role: UserRole.USER,
          profileImageUrl: 'url',
          color: '#666666',
          hasCustomAvatar: false,
          createdAt: new Date('2024-01-07'),
        },
      ]
      const findAll = mock(() =>
        Promise.resolve(users),
      ) as unknown as DrizzleUserRepository['findAll']
      mockRepo.findAll = findAll

      const result = await service.getAllUsers()

      expect(result).toEqual(users)
      expect(findAll).toHaveBeenCalledTimes(1)
    })
  })

  describe('deleteUserById', () => {
    it('deletes a user with cascade and emits an event', async () => {
      const user: UserDomain = {
        id: 'user-8',
        login: 'login-8',
        role: UserRole.ADMIN,
        profileImageUrl: 'url',
        color: '#888888',
        hasCustomAvatar: false,
        createdAt: new Date('2024-01-09'),
      }
      const findById = mock(() =>
        Promise.resolve(user),
      ) as unknown as DrizzleUserRepository['findById']
      const deleteWithCascade = mock(() =>
        Promise.resolve(),
      ) as unknown as DrizzleUserRepository['deleteWithCascade']
      mockRepo.findById = findById
      mockRepo.deleteWithCascade = deleteWithCascade

      await service.deleteUserById('user-8')

      expect(findById).toHaveBeenCalledWith('user-8')
      expect(deleteWithCascade).toHaveBeenCalledWith('user-8')
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('update-users', {
        userId: 'user-8',
        action: 'deleted',
      })
    })

    it('throws NotFoundException when the user does not exist', async () => {
      const findById = mock(() =>
        Promise.resolve(null),
      ) as unknown as DrizzleUserRepository['findById']
      mockRepo.findById = findById

      await expect(service.deleteUserById('missing-id')).rejects.toThrow(NotFoundException)
      expect(mockRepo.deleteWithCascade).not.toHaveBeenCalled()
      expect(mockEventEmitter.emit).not.toHaveBeenCalled()
    })
  })

  describe('getLinkedAccounts', () => {
    it('delegates to repository.findAccountsByUserId', async () => {
      const accounts = [
        {
          id: 1,
          userId: 'user-1',
          platform: 'TWITCH' as const,
          platformUserId: 'twitch-123',
          platformLogin: 'twitchuser',
          platformAvatar: 'url',
          createdAt: new Date('2024-01-10'),
        },
      ]
      const findAccountsByUserId = mock(() =>
        Promise.resolve(accounts),
      ) as unknown as DrizzleUserRepository['findAccountsByUserId']
      mockRepo.findAccountsByUserId = findAccountsByUserId

      const result = await service.getLinkedAccounts('user-1')

      expect(result).toEqual(accounts)
      expect(findAccountsByUserId).toHaveBeenCalledWith('user-1')
    })
  })
})
