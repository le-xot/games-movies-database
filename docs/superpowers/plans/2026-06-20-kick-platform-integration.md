# Kick Platform Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Kick OAuth as a second authentication platform alongside Twitch, with account linking support.

**Architecture:** Full database normalization — `User.id` changes from Twitch ID to UUID, new `UserAccount` table stores platform identities. New `KickService` module handles Kick OAuth2+PKCE flow. Auth flow adapts to lookup via `UserAccount` instead of direct Twitch ID.

**Tech Stack:** NestJS, Prisma, PostgreSQL, Vue 3, PKCE (Kick requirement)

## Global Constraints

- Package manager: Bun only
- Formatter: oxlint + oxfmt (no Prettier)
- Quotes: single quotes
- Indent: 2 spaces, max line 100
- Vue files: PascalCase
- Path alias: `@/` → `./src/`
- API client: auto-generated from Swagger — never edit `frontend/src/lib/api.ts` manually
- Kick OAuth host: `https://id.kick.com`
- Kick API host: `https://api.kick.com`
- Kick scopes: `user:read`
- No git commits during execution

---

## Task 1: Database Schema + Migration

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/<timestamp>_add_user_accounts/migration.sql`

**Interfaces:**
- Produces: `UserAccount` model, `Platform` enum, `User.id` with `@default(uuid())`

- [ ] Step 1: Add Platform enum to schema.prisma
- [ ] Step 2: Add UserAccount model to schema.prisma
- [ ] Step 3: Update User model (add accounts relation, change id default)
- [ ] Step 4: Create migration with raw SQL for data migration
- [ ] Step 5: Regenerate Prisma client
- [ ] Step 6: Verify migration

---

## Task 2: Kick Service Module

**Files:**
- Create: `backend/src/modules/kick/kick.service.ts`
- Create: `backend/src/modules/kick/kick.module.ts`
- Modify: `backend/src/utils/enviroments.ts`

**Interfaces:**
- Produces: `KickService` with methods: `getAuthorizationCode(code, codeVerifier)`, `getKickUser(accessToken)`, `getAppAccessToken()`

- [ ] Step 1: Add Kick env vars to enviroments.ts
- [ ] Step 2: Create kick.service.ts
- [ ] Step 3: Create kick.module.ts
- [ ] Step 4: Run linter

---

## Task 3: User Repository Refactor

**Files:**
- Modify: `backend/src/modules/user/repositories/user.repository.ts`
- Modify: `backend/src/modules/user/repositories/prisma-user.repository.ts`
- Modify: `backend/src/modules/user/user.service.ts`

**Interfaces:**
- Produces: `UserRepository.findByPlatformId(platform, platformUserId)`, updated `create()` that accepts platform info

- [ ] Step 1: Update CreateUserData interface
- [ ] Step 2: Add findByPlatformId to UserRepository abstract class
- [ ] Step 3: Remove findByTwitchId from UserRepository
- [ ] Step 4: Implement findByPlatformId in PrismaUserRepository
- [ ] Step 5: Update create() in PrismaUserRepository
- [ ] Step 6: Remove old findByTwitchId from PrismaUserRepository
- [ ] Step 7: Update UserService.upsertUser
- [ ] Step 8: Update admin detection in UserService
- [ ] Step 9: Run linter

---

## Task 4: Auth Service + Controller Refactor

**Files:**
- Modify: `backend/src/modules/auth/auth.service.ts`
- Modify: `backend/src/modules/auth/auth.controller.ts`
- Modify: `backend/src/modules/auth/auth.module.ts`

**Interfaces:**
- Produces: `handleKickCallback(code, codeVerifier)`, `linkKickAccount(userId, code, codeVerifier)`, updated `handleTwitchCallback`

- [ ] Step 1: Update auth.module.ts to import KickModule
- [ ] Step 2: Update AuthService.handleTwitchCallback
- [ ] Step 3: Add handleKickCallback to AuthService
- [ ] Step 4: Add linkKickAccount to AuthService
- [ ] Step 5: Add Kick endpoints to AuthController
- [ ] Step 6: Run linter

---

## Task 5: UserService Platform Methods

**Files:**
- Modify: `backend/src/modules/user/user.service.ts`
- Modify: `backend/src/modules/user/repositories/user.repository.ts`
- Modify: `backend/src/modules/user/repositories/prisma-user.repository.ts`

**Interfaces:**
- Produces: `UserService.getUserByPlatformId()`, `UserService.linkPlatformAccount()`

- [ ] Step 1: Add LinkPlatformData interface to user.repository.ts
- [ ] Step 2: Implement linkPlatformAccount in PrismaUserRepository
- [ ] Step 3: Add getUserByPlatformId to UserService
- [ ] Step 4: Add linkPlatformAccount to UserService
- [ ] Step 5: Run linter

---

## Task 6: Frontend — Login Dropdown

**Files:**
- Modify: `frontend/src/components/form/LoginForm.vue`
- Modify: `frontend/src/pages/auth/AuthCallback.vue`
- Create: `frontend/src/pages/auth/KickCallback.vue`
- Modify: `frontend/src/router/router.ts`
- Modify: `frontend/src/stores/use-user.ts`

**Interfaces:**
- Produces: Login dropdown with Twitch/Kick options, separate callback routes, updated user store

- [ ] Step 1: Update LoginForm.vue — add dropdown
- [ ] Step 2: Create KickCallback.vue
- [ ] Step 3: Add Kick callback route to router.ts
- [ ] Step 4: Update use-user.ts — add kickLogin mutation
- [ ] Step 5: Run linter

---

## Task 7: Frontend — Account Linking UI

**Files:**
- Create: `frontend/src/pages/profile/components/ConnectedAccounts.vue`
- Modify: `frontend/src/pages/profile/components/ProfilePageContent.vue`

**Interfaces:**
- Produces: Profile section showing linked platforms with connect buttons

- [ ] Step 1: Create ConnectedAccounts.vue
- [ ] Step 2: Add ConnectedAccounts to ProfilePageContent.vue
- [ ] Step 3: Add backend endpoint for linked accounts
- [ ] Step 4: Run linter

---

## Task 8: Environment + Documentation

**Files:**
- Modify: `backend/.env.example`

- [ ] Step 1: Add Kick vars to .env.example
