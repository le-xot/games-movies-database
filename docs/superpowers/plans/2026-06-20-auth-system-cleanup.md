# Auth System Cleanup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Twitch-specific hardcoding from UserService, fix repository abstractions, make the auth service layer platform-agnostic.

**Architecture:** Keep Prisma schema, AuthController, AuthService, and frontend unchanged. Clean up UserService (remove `createUserById`, `createUserByLogin`, `TwitchService` dependency), fix `getLinkedAccounts` to use proper repository method, remove unused admin endpoints from UserController.

**Tech Stack:** NestJS, Prisma, Bun test runner

## Global Constraints

- Package manager: Bun only
- Linter: oxlint (`bun lint`)
- Formatter: oxfmt (`bun format`)
- Single quotes, 2-space indent, 100 char max line
- No comments unless asked

---

### Task 1: Add `findAccountsByUserId` to UserRepository

**Files:**
- Modify: `backend/src/modules/user/repositories/user.repository.ts`
- Modify: `backend/src/modules/user/repositories/prisma-user.repository.ts`

**Interfaces:**
- Produces: `UserRepository.findAccountsByUserId(userId: string): Promise<UserAccount[]>`

- [ ] **Step 1: Add abstract method to UserRepository**

In `backend/src/modules/user/repositories/user.repository.ts`, add import for `UserAccount` from Prisma and add the abstract method:

```typescript
import { UserRole } from '@/enums'
import { UserDomain } from '@/modules/user/entities/user-domain.entity'
import type { UserAccount } from '@/generated/prisma'

export interface CreateUserData {
  login: string
  role: UserRole
  profileImageUrl: string
  color: string
  platform: string
  platformUserId: string
  platformLogin: string
  platformAvatar?: string
}

export interface UpdateUserData {
  login?: string
  role?: UserRole
  profileImageUrl?: string
  color?: string
}

export interface LinkPlatformData {
  platform: string
  platformUserId: string
  platformLogin: string
  platformAvatar?: string
}

export abstract class UserRepository {
  abstract findByPlatformId(platform: string, platformUserId: string): Promise<UserDomain | null>
  abstract findByLogin(login: string): Promise<UserDomain | null>
  abstract findById(id: string): Promise<UserDomain | null>
  abstract create(data: CreateUserData): Promise<UserDomain>
  abstract update(id: string, data: UpdateUserData): Promise<UserDomain>
  abstract findAll(): Promise<UserDomain[]>
  abstract deleteWithCascade(userId: string): Promise<void>
  abstract linkPlatformAccount(userId: string, data: LinkPlatformData): Promise<void>
  abstract findAccountsByUserId(userId: string): Promise<UserAccount[]>
}
```

- [ ] **Step 2: Implement in PrismaUserRepository**

In `backend/src/modules/user/repositories/prisma-user.repository.ts`, add the method:

```typescript
async findAccountsByUserId(userId: string) {
  return this.prisma.userAccount.findMany({
    where: { userId },
  })
}
```

- [ ] **Step 3: Verify types compile**

Run: `bun run --filter backend tsc --noEmit` (or `cd backend && bunx tsc --noEmit`)
Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/user/repositories/user.repository.ts backend/src/modules/user/repositories/prisma-user.repository.ts
git commit -m "feat: add findAccountsByUserId to UserRepository"
```

---

### Task 2: Simplify UserService — Remove Twitch-specific methods

**Files:**
- Modify: `backend/src/modules/user/user.service.ts`

**Interfaces:**
- Consumes: `UserRepository.findAccountsByUserId` (from Task 1)
- Produces: `UserService.upsertUser(platformId, data, platform)` — `login` and `profileImageUrl` now required, `platform` now required

- [ ] **Step 1: Rewrite UserService**

Replace the entire content of `backend/src/modules/user/user.service.ts` with:

```typescript
import { HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { UserRole } from '@/enums'
import { UserDomain } from '@/modules/user/entities/user-domain.entity'
import { LinkPlatformData, UserRepository } from '@/modules/user/repositories/user.repository'

interface UpdateUsersPayload {
  userId: string
  action: 'created' | 'updated' | 'deleted'
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)

  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async upsertUser(
    platformId: string,
    data: {
      login: string
      role?: UserRole
      profileImageUrl: string
      color?: string
    },
    platform: string,
  ): Promise<UserDomain> {
    const foundUser = await this.userRepository.findByPlatformId(platform, platformId)

    if (foundUser) {
      const updatedUser = await this.userRepository.update(foundUser.id, {
        login: data.login,
        role: data.role,
        profileImageUrl: data.profileImageUrl,
        color: data.color,
      })
      this.eventEmitter.emit('update-users', {
        userId: foundUser.id,
        action: 'updated',
      } satisfies UpdateUsersPayload)
      return updatedUser
    }

    const createdUser = await this.userRepository.create({
      login: data.login,
      role: data.role ?? UserRole.USER,
      profileImageUrl: data.profileImageUrl,
      color: data.color ?? '#333333',
      platform,
      platformUserId: platformId,
      platformLogin: data.login,
      platformAvatar: data.profileImageUrl,
    })
    this.eventEmitter.emit('update-users', {
      userId: createdUser.id,
      action: 'created',
    } satisfies UpdateUsersPayload)
    return createdUser
  }

  getUserByLogin(login: string): Promise<UserDomain | null> {
    return this.userRepository.findByLogin(login)
  }

  getUserById(id: string): Promise<UserDomain | null> {
    return this.userRepository.findById(id)
  }

  getUserByPlatformId(platform: string, platformUserId: string): Promise<UserDomain | null> {
    return this.userRepository.findByPlatformId(platform, platformUserId)
  }

  getAllUsers(): Promise<UserDomain[]> {
    return this.userRepository.findAll()
  }

  async deleteUserByLogin(login: string): Promise<void> {
    const user = await this.userRepository.findByLogin(login)
    if (!user) {
      throw new NotFoundException('User not found')
    }

    await this.userRepository.deleteWithCascade(user.id)

    this.eventEmitter.emit('update-users', {
      userId: user.id,
      action: 'deleted',
    } satisfies UpdateUsersPayload)
  }

  async deleteUserById(id: string): Promise<void> {
    const user = await this.userRepository.findById(id)
    if (!user) {
      throw new NotFoundException('User not found')
    }

    await this.userRepository.deleteWithCascade(id)

    this.eventEmitter.emit('update-users', {
      userId: id,
      action: 'deleted',
    } satisfies UpdateUsersPayload)
  }

  async updateLogin(userId: string, login: string): Promise<UserDomain> {
    const existing = await this.userRepository.findByLogin(login)
    if (existing && existing.id !== userId) {
      throw new HttpException('This nickname is already taken', HttpStatus.CONFLICT)
    }
    const user = await this.userRepository.update(userId, { login })
    this.eventEmitter.emit('update-users', {
      userId,
      action: 'updated',
    } satisfies UpdateUsersPayload)
    return user
  }

  async linkPlatformAccount(userId: string, data: LinkPlatformData): Promise<void> {
    const existing = await this.userRepository.findByPlatformId(data.platform, data.platformUserId)
    if (existing) {
      throw new Error('This platform account is already linked to another user')
    }
    await this.userRepository.linkPlatformAccount(userId, data)
  }

  async getLinkedAccounts(userId: string) {
    return this.userRepository.findAccountsByUserId(userId)
  }
}
```

- [ ] **Step 2: Verify types compile**

Run: `cd backend && bunx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add backend/src/modules/user/user.service.ts
git commit -m "refactor: remove Twitch-specific methods from UserService"
```

---

### Task 3: Remove TwitchModule from UserModule

**Files:**
- Modify: `backend/src/modules/user/user.module.ts`

- [ ] **Step 1: Update UserModule**

Replace content of `backend/src/modules/user/user.module.ts`:

```typescript
import { Module } from '@nestjs/common'
import { PrismaModule } from '@/database/prisma.module'
import { CustomJwtModule } from '@/modules/jwt/jwt.module'
import { PrismaUserRepository } from '@/modules/user/repositories/prisma-user.repository'
import { UserRepository } from '@/modules/user/repositories/user.repository'
import { UserController } from '@/modules/user/user.controller'
import { UserService } from '@/modules/user/user.service'
import { WebsocketModule } from '@/modules/websocket/websocket.module'

@Module({
  imports: [CustomJwtModule, PrismaModule, WebsocketModule],
  providers: [UserService, { provide: UserRepository, useClass: PrismaUserRepository }],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
```

- [ ] **Step 2: Verify types compile**

Run: `cd backend && bunx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add backend/src/modules/user/user.module.ts
git commit -m "refactor: remove TwitchModule from UserModule imports"
```

---

### Task 4: Remove unused admin endpoints from UserController

**Files:**
- Modify: `backend/src/modules/user/user.controller.ts`
- Modify: `backend/src/modules/user/user.dto.ts`

- [ ] **Step 1: Clean up UserController**

Remove `POST /users/login` and `POST /users/:id` endpoints. Replace content of `backend/src/modules/user/user.controller.ts`:

```typescript
import { Controller, Delete, Get, HttpStatus, Param, UseGuards } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { UserRole } from '@/enums'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { RolesGuard } from '@/modules/auth/auth.roles.guard'
import { UserEntity } from '@/modules/user/user.entity'
import { UserService } from '@/modules/user/user.service'
import { THROTTLER_LIMITS } from '@/utils/throttler'

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('users')
  @UseGuards()
  @ApiResponse({ status: 200, type: UserEntity, isArray: true })
  async getAllUsers(): Promise<UserEntity[]> {
    const users = await this.userService.getAllUsers()
    return users.map((user) => ({
      id: user.id,
      login: user.login,
      role: user.role,
      profileImageUrl: user.profileImageUrl,
      color: user.color,
      createdAt: user.createdAt,
    }))
  }

  @Get(':id')
  @UseGuards(AuthGuard, new RolesGuard([UserRole.ADMIN]))
  @ApiResponse({ status: HttpStatus.OK })
  async getUserById(@Param('id') id: string) {
    return await this.userService.getUserById(id)
  }

  @Get(':login')
  @UseGuards(AuthGuard, new RolesGuard([UserRole.ADMIN]))
  @ApiResponse({ status: HttpStatus.OK })
  async getUserByLogin(@Param('login') login: string) {
    return await this.userService.getUserByLogin(login)
  }

  @Delete(':id')
  @Throttle({ default: THROTTLER_LIMITS.write })
  @UseGuards(AuthGuard, new RolesGuard([UserRole.ADMIN]))
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.userService.deleteUserById(id)
  }

  @Delete(':login')
  @Throttle({ default: THROTTLER_LIMITS.write })
  @UseGuards(AuthGuard, new RolesGuard([UserRole.ADMIN]))
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async deleteUserByLogin(@Param('login') login: string): Promise<void> {
    await this.userService.deleteUserByLogin(login)
  }
}
```

- [ ] **Step 2: Remove UserCreateByLoginDTO from user.dto.ts**

In `backend/src/modules/user/user.dto.ts`, remove the `UserCreateByLoginDTO` class and its unused imports. Keep only `UserUpdateDTO`:

```typescript
import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsHexColor, IsOptional, IsString, IsUrl } from 'class-validator'
import { UserRole } from '@/enums'
import { UserRole as UserRoleName } from '@/enums/enums.names'

export class UserUpdateDTO {
  @ApiProperty({ example: 'john_doe', required: false })
  @IsOptional()
  @IsString()
  login?: string

  @ApiProperty({
    example: UserRole.USER,
    enum: UserRole,
    enumName: UserRoleName,
    default: UserRole.USER,
    required: false,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole

  @ApiProperty({ example: 'https://example.com/image.jpg', required: false })
  @IsOptional()
  @IsUrl()
  profileImageUrl?: string

  @ApiProperty({
    example: '#333333',
    required: false,
  })
  @IsHexColor()
  @IsOptional()
  color?: string
}
```

- [ ] **Step 3: Verify types compile**

Run: `cd backend && bunx tsc --noEmit`
Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/user/user.controller.ts backend/src/modules/user/user.dto.ts
git commit -m "refactor: remove unused admin endpoints and UserCreateByLoginDTO"
```

---

### Task 5: Update tests

**Files:**
- Modify: `backend/src/modules/user/__tests__/user.service.spec.ts`

- [ ] **Step 1: Rewrite test file**

Replace content of `backend/src/modules/user/__tests__/user.service.spec.ts`:

```typescript
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

  beforeEach(() => {
    mockRepo = createMock(UserRepository)
    mockEventEmitter = { emit: mock(() => {}) }
    service = new UserService(mockRepo, mockEventEmitter as any)
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
      }, 'TWITCH')

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
      }, 'KICK')

      expect(result).toEqual(createdUser)
      expect(findByPlatformId).toHaveBeenCalledWith('KICK', 'user-2')
      expect(create).toHaveBeenCalledWith({
        login: 'new-user',
        role: UserRole.USER,
        profileImageUrl: 'new-url',
        color: '#333333',
        platform: 'KICK',
        platformUserId: 'user-2',
        platformLogin: 'new-user',
        platformAvatar: 'new-url',
      })
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('update-users', {
        userId: 'user-2',
        action: 'created',
      })
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

  describe('getLinkedAccounts', () => {
    it('delegates to repository.findAccountsByUserId', async () => {
      const accounts = [
        { platform: 'TWITCH', platformLogin: 'twitchuser', platformAvatar: 'url' },
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
```

- [ ] **Step 2: Run tests**

Run: `cd backend && bun test src/modules/user/__tests__/user.service.spec.ts`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add backend/src/modules/user/__tests__/user.service.spec.ts
git commit -m "test: update UserService tests for platform-agnostic upsertUser"
```

---

### Task 6: Lint and format

- [ ] **Step 1: Run linter**

Run: `bun lint`
Expected: No errors

- [ ] **Step 2: Run formatter**

Run: `bun format`
Expected: Files formatted

- [ ] **Step 3: Verify build**

Run: `bun build`
Expected: Build succeeds

- [ ] **Step 4: Commit formatting changes if any**

```bash
git add -A
git commit -m "style: lint and format"
```
