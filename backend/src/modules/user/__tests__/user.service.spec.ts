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
  let mockTwitch: {
    getTwitchUserById: ReturnType<typeof mock>
    searchTwitchUsers: ReturnType<typeof mock>
  }
  let mockEventEmitter: { emit: ReturnType<typeof mock> }

  beforeEach(() => {
    mockRepo = createMock(UserRepository)
    mockTwitch = {
      getTwitchUserById: mock(() => undefined),
      searchTwitchUsers: mock(() => undefined),
    } as any
    mockEventEmitter = { emit: mock(() => {}) }
    service = new UserService(mockRepo, mockTwitch as any, mockEventEmitter as any)
  })

  describe('upsertUser', () => {
    it('updates an existing user', async () => {
      const existingUser: UserDomain = {
        id: 'user-1',
        login: 'old-login',
        role: UserRole.USER,
        profileImageUrl: 'old-url',
        color: '#111111',
        createdAt: new Date('2024-01-01'),
      }
      const updatedUser: UserDomain = {
        ...existingUser,
        login: 'new-login',
      }
      const findByPlatformId = mock(() =>
        Promise.resolve(existingUser),
      ) as unknown as UserRepository['findByPlatformId']
      const update = mock(() => Promise.resolve(updatedUser)) as unknown as UserRepository['update']
      mockRepo.findByPlatformId = findByPlatformId
      mockRepo.update = update

      const result = await service.upsertUser('user-1', {
        login: 'new-login',
        role: UserRole.ADMIN,
        profileImageUrl: 'new-url',
        color: '#222222',
      })

      expect(result).toEqual(updatedUser)
      expect(findByPlatformId).toHaveBeenCalledWith('TWITCH', 'user-1')
      expect(update).toHaveBeenCalledWith('user-1', {
        login: 'new-login',
        role: UserRole.ADMIN,
        profileImageUrl: 'new-url',
        color: '#222222',
      })
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('update-users', {
        userId: 'user-1',
        action: 'updated',
      })
    })

    it('creates a user when full data is provided and no user exists', async () => {
      const createdUser: UserDomain = {
        id: 'user-2',
        login: 'new-user',
        role: UserRole.USER,
        profileImageUrl: 'new-url',
        color: '#333333',
        createdAt: new Date('2024-01-02'),
      }
      const findByPlatformId = mock(() =>
        Promise.resolve(null),
      ) as unknown as UserRepository['findByPlatformId']
      const create = mock(() => Promise.resolve(createdUser)) as unknown as UserRepository['create']
      mockRepo.findByPlatformId = findByPlatformId
      mockRepo.create = create

      const result = await service.upsertUser('user-2', {
        login: 'new-user',
        role: UserRole.USER,
        profileImageUrl: 'new-url',
        color: '#333333',
      })

      expect(result).toEqual(createdUser)
      expect(findByPlatformId).toHaveBeenCalledWith('TWITCH', 'user-2')
      expect(create).toHaveBeenCalledWith({
        login: 'new-user',
        role: UserRole.USER,
        profileImageUrl: 'new-url',
        color: '#333333',
        platform: 'TWITCH',
        platformUserId: 'user-2',
        platformLogin: 'new-user',
        platformAvatar: 'new-url',
      })
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('update-users', {
        userId: 'user-2',
        action: 'created',
      })
    })

    it('creates a user by login when no user exists and data is incomplete', async () => {
      const findByPlatformId = mock(() =>
        Promise.resolve(null),
      ) as unknown as UserRepository['findByPlatformId']
      const createUserByLogin = mock(() => Promise.resolve({} as UserDomain))
      mockRepo.findByPlatformId = findByPlatformId
      service.createUserByLogin = createUserByLogin as unknown as UserService['createUserByLogin']

      const result = await service.upsertUser('user-3', { login: 'partial-login' })

      expect(result).toEqual({} as UserDomain)
      expect(findByPlatformId).toHaveBeenCalledWith('TWITCH', 'user-3')
      expect(createUserByLogin).toHaveBeenCalledWith('partial-login')
    })
  })

  describe('createUserById', () => {
    it('creates a user from Twitch data and emits an update event', async () => {
      const twitchUser = {
        id: 'twitch-1',
        login: 'twitch-login',
        profile_image_url: 'https://image.url/avatar.png',
      }
      const createdUser: UserDomain = {
        id: 'twitch-1',
        login: 'twitch-login',
        role: UserRole.USER,
        profileImageUrl: 'https://image.url/avatar.png',
        color: '#333333',
        createdAt: new Date('2024-01-03'),
      }
      const getTwitchUserById = mock(() =>
        Promise.resolve(twitchUser),
      ) as unknown as typeof mockTwitch.getTwitchUserById
      const create = mock(() => Promise.resolve(createdUser)) as unknown as UserRepository['create']
      mockTwitch.getTwitchUserById = getTwitchUserById
      mockRepo.create = create

      const result = await service.createUserById('twitch-1')

      expect(result).toEqual(createdUser)
      expect(getTwitchUserById).toHaveBeenCalledWith('twitch-1')
      expect(create).toHaveBeenCalledWith({
        login: 'twitch-login',
        role: UserRole.USER,
        profileImageUrl: 'https://image.url/avatar.png',
        color: '#333333',
        platform: 'TWITCH',
        platformUserId: 'twitch-1',
        platformLogin: 'twitch-login',
        platformAvatar: 'https://image.url/avatar.png',
      })
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('update-users', {
        userId: 'twitch-1',
        action: 'created',
      })
    })

    it('throws when Twitch does not return a user', async () => {
      const getTwitchUserById = mock(() =>
        Promise.resolve(null),
      ) as unknown as typeof mockTwitch.getTwitchUserById
      mockTwitch.getTwitchUserById = getTwitchUserById

      await expect(service.createUserById('missing-id')).rejects.toThrow(
        'User with id missing-id not found on Twitch',
      )
      expect(mockEventEmitter.emit).not.toHaveBeenCalled()
    })
  })

  describe('createUserByLogin', () => {
    it('creates a user from Twitch search results and emits an update event', async () => {
      const twitchUsers = [
        {
          id: 'twitch-2',
          login: 'search-login',
          profile_image_url: '',
        },
      ]
      const createdUser: UserDomain = {
        id: 'twitch-2',
        login: 'search-login',
        role: UserRole.USER,
        profileImageUrl:
          'https://static-cdn.jtvnw.net/user-default-pictures-uv/' +
          'ead5c8b2-a4c9-4724-b1dd-9f00b46cbd3d-profile_image-300x300.png',
        color: '#333333',
        createdAt: new Date('2024-01-04'),
      }
      const searchTwitchUsers = mock(() =>
        Promise.resolve(twitchUsers),
      ) as unknown as typeof mockTwitch.searchTwitchUsers
      const create = mock(() => Promise.resolve(createdUser)) as unknown as UserRepository['create']
      mockTwitch.searchTwitchUsers = searchTwitchUsers
      mockRepo.create = create

      const result = await service.createUserByLogin('search-login')

      expect(result).toEqual(createdUser)
      expect(searchTwitchUsers).toHaveBeenCalledWith('search-login')
      expect(create).toHaveBeenCalledWith({
        login: 'search-login',
        role: UserRole.USER,
        profileImageUrl:
          'https://static-cdn.jtvnw.net/user-default-pictures-uv/' +
          'ead5c8b2-a4c9-4724-b1dd-9f00b46cbd3d-profile_image-300x300.png',
        color: '#333333',
        platform: 'TWITCH',
        platformUserId: 'twitch-2',
        platformLogin: 'search-login',
        platformAvatar: '',
      })
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('update-users', {
        userId: 'twitch-2',
        action: 'created',
      })
    })

    it('throws when Twitch search returns no results', async () => {
      const searchTwitchUsers = mock(() =>
        Promise.resolve([]),
      ) as unknown as typeof mockTwitch.searchTwitchUsers
      mockTwitch.searchTwitchUsers = searchTwitchUsers

      await expect(service.createUserByLogin('missing-login')).rejects.toThrow(
        'User with login missing-login not found on Twitch',
      )
      expect(mockEventEmitter.emit).not.toHaveBeenCalled()
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
})
