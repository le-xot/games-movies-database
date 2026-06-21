import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { NotFoundException } from '@nestjs/common'
import { createMock } from '@/__tests__/helpers/mock-factory'
import { UserRole } from '@/enums'
import { UserDomain } from '../entities/user-domain.entity'
import { UserRepository } from '../repositories/user.repository'
import { UserService } from '../user.service'

describe('UserService', () => {
  let service: UserService
  let mockRepo: UserRepository
  let mockEventEmitter: { emit: ReturnType<typeof mock> }
  let mockAvatarService: {
    fetchAndStoreOAuthAvatar: ReturnType<typeof mock>
    processAndStoreAvatar: ReturnType<typeof mock>
    deleteAvatarFromS3: ReturnType<typeof mock>
  }

  beforeEach(() => {
    mockRepo = createMock(UserRepository)
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
      ) as unknown as UserRepository['findByPlatformId']
      const update = mock(() => Promise.resolve(updatedUser)) as unknown as UserRepository['update']
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
      ) as unknown as UserRepository['findByPlatformId']
      const update = mock(() => Promise.resolve(updatedUser)) as unknown as UserRepository['update']
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
      ) as unknown as UserRepository['findByPlatformId']
      const create = mock(() => Promise.resolve(createdUser)) as unknown as UserRepository['create']
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
  })

  describe('getUserByLogin', () => {
    it('delegates to repository.findByLogin', async () => {
      const user: UserDomain = {
        id: 'user-4',
        login: 'login-4',
        role: UserRole.USER,
        profileImageUrl: 'url',
        color: '#444444',
        hasCustomAvatar: false,
        createdAt: new Date('2024-01-05'),
      }
      const findByLogin = mock(() =>
        Promise.resolve(user),
      ) as unknown as UserRepository['findByLogin']
      mockRepo.findByLogin = findByLogin

      const result = await service.getUserByLogin('login-4')

      expect(result).toEqual(user)
      expect(findByLogin).toHaveBeenCalledWith('login-4')
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
      const findById = mock(() => Promise.resolve(user)) as unknown as UserRepository['findById']
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
      const findAll = mock(() => Promise.resolve(users)) as unknown as UserRepository['findAll']
      mockRepo.findAll = findAll

      const result = await service.getAllUsers()

      expect(result).toEqual(users)
      expect(findAll).toHaveBeenCalledTimes(1)
    })
  })

  describe('deleteUserByLogin', () => {
    it('deletes a user with cascade and emits an event', async () => {
      const user: UserDomain = {
        id: 'user-7',
        login: 'login-7',
        role: UserRole.USER,
        profileImageUrl: 'url',
        color: '#777777',
        hasCustomAvatar: false,
        createdAt: new Date('2024-01-08'),
      }
      const findByLogin = mock(() =>
        Promise.resolve(user),
      ) as unknown as UserRepository['findByLogin']
      const deleteWithCascade = mock(() =>
        Promise.resolve(),
      ) as unknown as UserRepository['deleteWithCascade']
      mockRepo.findByLogin = findByLogin
      mockRepo.deleteWithCascade = deleteWithCascade

      await service.deleteUserByLogin('login-7')

      expect(findByLogin).toHaveBeenCalledWith('login-7')
      expect(deleteWithCascade).toHaveBeenCalledWith('user-7')
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('update-users', {
        userId: 'user-7',
        action: 'deleted',
      })
    })

    it('throws NotFoundException when the user does not exist', async () => {
      const findByLogin = mock(() =>
        Promise.resolve(null),
      ) as unknown as UserRepository['findByLogin']
      mockRepo.findByLogin = findByLogin

      await expect(service.deleteUserByLogin('missing-login')).rejects.toThrow(NotFoundException)
      expect(mockRepo.deleteWithCascade).not.toHaveBeenCalled()
      expect(mockEventEmitter.emit).not.toHaveBeenCalled()
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
      const findById = mock(() => Promise.resolve(user)) as unknown as UserRepository['findById']
      const deleteWithCascade = mock(() =>
        Promise.resolve(),
      ) as unknown as UserRepository['deleteWithCascade']
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
      const findById = mock(() => Promise.resolve(null)) as unknown as UserRepository['findById']
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
      ) as unknown as UserRepository['findAccountsByUserId']
      mockRepo.findAccountsByUserId = findAccountsByUserId

      const result = await service.getLinkedAccounts('user-1')

      expect(result).toEqual(accounts)
      expect(findAccountsByUserId).toHaveBeenCalledWith('user-1')
    })
  })
})
