import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { ConflictException, NotFoundException } from '@nestjs/common'
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
    generateAndStoreDefaultAvatar: ReturnType<typeof mock>
  }

  beforeEach(() => {
    mockRepo = createMock(DrizzleUserRepository)
    mockEventEmitter = { emit: mock(() => {}) }
    mockAvatarService = {
      generateAndStoreDefaultAvatar: mock(() => Promise.resolve('/api/avatar/user-1?t=1')),
    }
    service = new UserService(mockRepo, mockEventEmitter as any, mockAvatarService as any)
  })

  describe('upsertUser', () => {
    const baseUser: UserDomain = {
      id: 'user-1',
      login: 'old-login',
      role: UserRole.USER,
      profileImageUrl: '/api/avatar/user-1?t=old',
      color: '#111111',
      hasCustomAvatar: false,
      createdAt: new Date('2024-01-01'),
    }

    it('regenerates the default avatar on every login without custom avatar', async () => {
      const updatedUser: UserDomain = {
        ...baseUser,
        profileImageUrl: '/api/avatar/user-1?t=1',
      }
      mockRepo.findByPlatformId = mock(() => Promise.resolve(baseUser)) as any
      const update = mock(() => Promise.resolve(updatedUser)) as any
      mockRepo.update = update

      const result = await service.upsertUser(
        'user-1',
        {
          login: 'new-login',
          role: UserRole.ADMIN,
          platformAvatar: 'https://cdn.example.com/avatar.jpg',
          color: '#222222',
        },
        'TWITCH',
      )

      expect(result).toEqual(updatedUser)
      expect(mockAvatarService.generateAndStoreDefaultAvatar).toHaveBeenCalledWith(
        'user-1',
        'new-login',
      )
      expect(update).toHaveBeenCalledWith('user-1', {
        role: UserRole.ADMIN,
        profileImageUrl: '/api/avatar/user-1?t=1',
        color: '#222222',
      })
    })

    it('skips avatar generation when user has custom avatar', async () => {
      const customUser: UserDomain = { ...baseUser, hasCustomAvatar: true }
      mockRepo.findByPlatformId = mock(() => Promise.resolve(customUser)) as any
      const update = mock(() => Promise.resolve(customUser)) as any
      mockRepo.update = update

      await service.upsertUser('user-1', { login: 'new-login' }, 'TWITCH')

      expect(mockAvatarService.generateAndStoreDefaultAvatar).not.toHaveBeenCalled()
      expect(update).toHaveBeenCalledWith('user-1', {
        role: undefined,
        color: undefined,
      })
    })

    it('keeps the previous url when generation fails on login', async () => {
      const updatedUser: UserDomain = { ...baseUser }
      mockRepo.findByPlatformId = mock(() => Promise.resolve(baseUser)) as any
      const update = mock(() => Promise.resolve(updatedUser)) as any
      mockRepo.update = update
      mockAvatarService.generateAndStoreDefaultAvatar = mock(() =>
        Promise.reject(new Error('s3 down')),
      )

      const result = await service.upsertUser('user-1', { login: 'new-login' }, 'TWITCH')

      expect(result).toEqual(updatedUser)
      expect(update).toHaveBeenCalledWith('user-1', {
        role: undefined,
        profileImageUrl: baseUser.profileImageUrl,
        color: undefined,
      })
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('update-users', {
        userId: 'user-1',
        action: 'updated',
      })
    })

    it('creates a user with a generated avatar and no oauth profile photo', async () => {
      const createdUser: UserDomain = {
        id: 'user-2',
        login: 'new-user',
        role: UserRole.USER,
        profileImageUrl: '',
        color: '#333333',
        hasCustomAvatar: false,
        createdAt: new Date('2024-01-02'),
      }
      const updatedUser: UserDomain = {
        ...createdUser,
        profileImageUrl: '/api/avatar/user-2?t=1',
      }
      mockRepo.findByPlatformId = mock(() => Promise.resolve(null)) as any
      const create = mock(() => Promise.resolve(createdUser)) as any
      mockRepo.create = create
      const update = mock(() => Promise.resolve(updatedUser)) as any
      mockRepo.update = update
      mockAvatarService.generateAndStoreDefaultAvatar = mock(() =>
        Promise.resolve('/api/avatar/user-2?t=1'),
      )

      const result = await service.upsertUser(
        'twitch-platform-777',
        {
          login: 'new-user',
          platformAvatar: 'https://cdn.example.com/avatar.jpg',
        },
        'TWITCH',
      )

      expect(create).toHaveBeenCalledWith({
        login: 'new-user',
        role: UserRole.USER,
        profileImageUrl: '',
        color: '#333333',
        platform: 'TWITCH',
        platformUserId: 'twitch-platform-777',
        platformLogin: 'new-user',
        platformAvatar: 'https://cdn.example.com/avatar.jpg',
      })
      expect(mockAvatarService.generateAndStoreDefaultAvatar).toHaveBeenCalledWith(
        'user-2',
        'new-user',
      )
      expect(update).toHaveBeenCalledWith('user-2', {
        profileImageUrl: '/api/avatar/user-2?t=1',
      })
      expect(result.profileImageUrl).toBe('/api/avatar/user-2?t=1')
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

  describe('deleteAvatar', () => {
    it('replaces the custom avatar with a generated one', async () => {
      const user: UserDomain = {
        id: 'user-8',
        login: 'login-8',
        role: UserRole.USER,
        profileImageUrl: '/api/avatar/user-8?t=old',
        color: '#888888',
        hasCustomAvatar: true,
        createdAt: new Date('2024-01-09'),
      }
      const updatedUser: UserDomain = {
        ...user,
        profileImageUrl: '/api/avatar/user-8?t=2',
        hasCustomAvatar: false,
      }
      mockRepo.findById = mock(() => Promise.resolve(user)) as any
      const update = mock(() => Promise.resolve(updatedUser)) as any
      mockRepo.update = update
      mockAvatarService.generateAndStoreDefaultAvatar = mock(() =>
        Promise.resolve('/api/avatar/user-8?t=2'),
      )

      const result = await service.deleteAvatar('user-8')

      expect(mockAvatarService.generateAndStoreDefaultAvatar).toHaveBeenCalledWith(
        'user-8',
        'login-8',
      )
      expect(update).toHaveBeenCalledWith('user-8', {
        profileImageUrl: '/api/avatar/user-8?t=2',
        hasCustomAvatar: false,
      })
      expect(result).toEqual(updatedUser)
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('update-users', {
        userId: 'user-8',
        action: 'updated',
      })
    })

    it('keeps the custom avatar when generation fails', async () => {
      const user: UserDomain = {
        id: 'user-8',
        login: 'login-8',
        role: UserRole.USER,
        profileImageUrl: '/api/avatar/user-8?t=old',
        color: '#888888',
        hasCustomAvatar: true,
        createdAt: new Date('2024-01-09'),
      }
      mockRepo.findById = mock(() => Promise.resolve(user)) as any
      mockAvatarService.generateAndStoreDefaultAvatar = mock(() =>
        Promise.reject(new Error('s3 down')),
      )

      await expect(service.deleteAvatar('user-8')).rejects.toThrow('s3 down')
      expect(mockRepo.update).not.toHaveBeenCalled()
      expect(mockEventEmitter.emit).not.toHaveBeenCalled()
    })
  })

  describe('updateLogin', () => {
    const user: UserDomain = {
      id: 'user-1',
      login: 'old-login',
      role: UserRole.USER,
      profileImageUrl: 'url',
      color: '#111111',
      hasCustomAvatar: false,
      createdAt: new Date('2024-01-01'),
    }

    it('rejects a login already used by another user', async () => {
      mockRepo.findByLogin = mock(() => Promise.resolve({ ...user, id: 'user-2' })) as any

      await expect(service.updateLogin('user-1', 'taken')).rejects.toThrow(ConflictException)
      expect(mockRepo.update).not.toHaveBeenCalled()
      expect(mockEventEmitter.emit).not.toHaveBeenCalled()
    })

    it('allows keeping the current login', async () => {
      mockRepo.findByLogin = mock(() => Promise.resolve(user)) as any
      const update = mock(() => Promise.resolve(user)) as any
      mockRepo.update = update

      await service.updateLogin('user-1', 'old-login')

      expect(update).toHaveBeenCalledWith('user-1', { login: 'old-login' })
    })

    it('updates a free login', async () => {
      mockRepo.findByLogin = mock(() => Promise.resolve(null)) as any
      const updated: UserDomain = { ...user, login: 'new-login' }
      const update = mock(() => Promise.resolve(updated)) as any
      mockRepo.update = update

      const result = await service.updateLogin('user-1', 'new-login')

      expect(update).toHaveBeenCalledWith('user-1', { login: 'new-login' })
      expect(result.login).toBe('new-login')
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('update-users', {
        userId: 'user-1',
        action: 'updated',
      })
    })
  })
})
