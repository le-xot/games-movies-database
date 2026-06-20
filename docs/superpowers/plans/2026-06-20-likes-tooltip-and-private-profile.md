# Likes Tooltip + Private Profile — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show who liked a suggestion via tooltip, and make the profile page private (owner-only).

**Architecture:** Backend includes user data in likes when fetching suggestions. Frontend renders a tooltip with user avatars on hover. Profile page loses its `:userId` param and all links to other users' profiles are removed.

**Tech Stack:** NestJS, Prisma, Vue 3, shadcn-vue (Tooltip), Pinia

## Global Constraints

- Package manager: Bun only
- Lint: `bun lint` (oxlint) + `bun format:check` (oxfmt)
- `frontend/src/lib/api.ts` is auto-generated — never edit manually
- Single quotes, 2-space indent, max 100 chars
- Vue files: PascalCase, events: kebab-case
- Icons: lucide-vue-next only

---

### Task 1: Backend — Add `user` field to `LikeEntity`

**Files:**

- Modify: `backend/src/modules/like/like.entity.ts`

**Interfaces:**

- Produces: `LikeEntity.user` optional field consumed by `RecordEntity` (Task 2) and auto-generated `frontend/src/lib/api.ts`

- [ ] **Step 1: Add import for `UserEntity`**

At the top of `backend/src/modules/like/like.entity.ts`, add import:

```ts
import { UserEntity } from '@/modules/user/user.entity'
```

- [ ] **Step 2: Add `user` property to `LikeEntity`**

After the `recordId` property (line 10), add:

```ts
  @ApiProperty({ type: UserEntity, required: false, nullable: true })
  user?: UserEntity | null
```

- [ ] **Step 3: Verify build**

Run: `cd backend && bun build --target=node src/main.ts`
Expected: no errors

---

### Task 2: Backend — Expand `likes` type in `RecordWithRelations`

**Files:**

- Modify: `backend/src/modules/record/entities/record-domain.entity.ts:29`

**Interfaces:**

- Consumes: `LikeEntity.user` from Task 1
- Produces: `RecordWithRelations.likes[].user` used by suggestion repository (Task 3) and SuggestionCard tooltip (Task 4)

- [ ] **Step 1: Update `likes` type**

In `backend/src/modules/record/entities/record-domain.entity.ts`, replace line 29:

```ts
  likes?: Array<{ id: string; userId: string; recordId: number; createdAt: Date }>
```

with:

```ts
  likes?: Array<{
    id: string
    userId: string
    recordId: number
    createdAt: Date
    user?: { id: string; login: string; profileImageUrl: string; color: string }
  }>
```

- [ ] **Step 2: Verify build**

Run: `cd backend && bun build --target=node src/main.ts`
Expected: no errors

---

### Task 3: Backend — Include `likes.user` in suggestion query

**Files:**

- Modify: `backend/src/modules/suggestion/repositories/prisma-suggestion.repository.ts:58`

**Interfaces:**

- Consumes: `RecordWithRelations.likes[].user` from Task 2
- Produces: Suggestion API responses now include user data in likes

- [ ] **Step 1: Update `findSuggestions` include**

In `backend/src/modules/suggestion/repositories/prisma-suggestion.repository.ts`, line 58, replace:

```ts
        likes: true,
```

with:

```ts
        likes: { include: { user: true } },
```

- [ ] **Step 2: Verify build**

Run: `cd backend && bun build --target=node src/main.ts`
Expected: no errors

- [ ] **Step 3: Run lint**

Run: `bun lint`
Expected: no errors

---

### Task 4: Frontend — Add likes tooltip to SuggestionCard

**Files:**

- Modify: `frontend/src/pages/suggestion/components/SuggestionCard.vue`

**Interfaces:**

- Consumes: `likes[].user` from API (auto-generated after Tasks 1-3 + dev restart)
- Produces: Tooltip UI on like button hover

- [ ] **Step 1: Add Tooltip imports**

In the `<script setup>` imports section of `SuggestionCard.vue`, add:

```ts
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
```

- [ ] **Step 2: Wrap like button in Tooltip**

Replace the `<button>` block (lines 200-219) that renders the like button. The entire `<button>` element becomes the `TooltipTrigger` inside a `TooltipProvider > Tooltip`:

```vue
<TooltipProvider :delay-duration="200">
                <Tooltip>
                  <TooltipTrigger as-child>
                    <button
                      size="sm"
                      :disabled="likingStates.get(item.id)"
                      :class="
                        isLikedByCurrentUser(item)
                          ? 'bg-red-500/50 border-red-500'
                          : 'bg-[hsla(var(--primary-foreground))] border-white'
                      "
                      class="flex justify-center outline-1 backdrop-blur-lg items-center gap-2 absolute -bottom-4 -right-4 z-10 rounded-full w-20 h-10 p-0"
                      @click="handleLikeClick(item.id)"
                    >
                      <Heart
                        v-if="isLikedByCurrentUser(item)"
                        color="red"
                        fill="rgb(239 68 68)"
                        class="w-6 h-6"
                      />
                      <Heart v-else class="w-6 h-6" />
                      <span class="ml-1">{{ getLikesCount(item) }}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    v-if="item.likes && item.likes.length > 0"
                    side="top"
                    class="flex flex-col gap-1.5 p-2"
                  >
                    <div
                      v-for="likeItem in item.likes"
                      :key="likeItem.id"
                      class="flex items-center gap-2"
                    >
                      <Avatar class="w-6 h-6">
                        <AvatarImage
                          v-if="likeItem.user"
                          :src="likeItem.user.profileImageUrl"
                        />
                        <AvatarFallback class="text-xs">
                          {{ likeItem.user?.login?.charAt(0)?.toUpperCase() ?? '?' }}
                        </AvatarFallback>
                      </Avatar>
                      <span class="text-sm">{{ likeItem.user?.login ?? 'Unknown' }}</span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
```

- [ ] **Step 3: Run lint**

Run: `bun lint`
Expected: no errors

---

### Task 5: Frontend — Remove author profile RouterLink from SuggestionCard

**Files:**

- Modify: `frontend/src/pages/suggestion/components/SuggestionCard.vue:318-325`

**Interfaces:**

- None (UI-only change)

- [ ] **Step 1: Replace RouterLink with plain elements**

In `SuggestionCard.vue`, replace lines 317-329:

```vue
                      <div class="flex items-center">
                        <RouterLink
                          :to="`${ROUTER_PATHS.profile}/${item.suggestionOwnership.user.id}`"
                        >
                          <Avatar class="w-8 h-8 mr-2">
                            <AvatarImage :src="item.suggestionOwnership.user.profileImageUrl" />
                            <AvatarFallback />
                          </Avatar>
                        </RouterLink>
                        <div class="text-base text-white font-medium">
                          {{ item.suggestionOwnership.user.login }}
                        </div>
                      </div>
```

with:

```vue
                      <div class="flex items-center">
                        <Avatar class="w-8 h-8 mr-2">
                          <AvatarImage :src="item.suggestionOwnership.user.profileImageUrl" />
                          <AvatarFallback />
                        </Avatar>
                        <div class="text-base text-white font-medium">
                          {{ item.suggestionOwnership.user.login }}
                        </div>
                      </div>
```

- [ ] **Step 2: Remove unused RouterLink import**

Remove `RouterLink` from the import on line 5:

```ts
import { RouterLink } from 'vue-router'
```

Remove the entire line.

- [ ] **Step 3: Remove unused `ROUTER_PATHS` import**

Check if `ROUTER_PATHS` is still used elsewhere in the file. If not (it was only used for the profile link), remove:

```ts
import { ROUTER_PATHS } from '@/router/router-paths'
```

- [ ] **Step 4: Run lint**

Run: `bun lint`
Expected: no errors

---

### Task 6: Frontend — Make profile route private (owner-only)

**Files:**

- Modify: `frontend/src/router/router.ts:42`
- Modify: `frontend/src/pages/profile/components/ProfilePageContent.vue`
- Modify: `frontend/src/pages/profile/components/ProfileHeader.vue`

**Interfaces:**

- None (UI-only changes)

- [ ] **Step 1: Remove `:userId?` from route**

In `frontend/src/router/router.ts`, line 42, replace:

```ts
          path: ROUTER_PATHS.profile + '/:userId?',
```

with:

```ts
          path: ROUTER_PATHS.profile,
```

- [ ] **Step 2: Simplify ProfilePageContent**

Replace the entire `<script setup>` in `frontend/src/pages/profile/components/ProfilePageContent.vue` with:

```vue
<script setup lang="ts">
import { Check, Pencil, X } from '@lucide/vue'
import { useTitle } from '@vueuse/core'
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUser } from '@/stores/use-user'
import ConnectedAccounts from './ConnectedAccounts.vue'
import ProfileHeader from './ProfileHeader.vue'

useTitle('Профиль')

const userStore = useUser()

const isEditingNickname = ref(false)
const nicknameInput = ref('')
const nicknameError = ref('')
const isSavingNickname = ref(false)

function startEditNickname() {
  nicknameInput.value = userStore.user?.login ?? ''
  nicknameError.value = ''
  isEditingNickname.value = true
}

function cancelEditNickname() {
  isEditingNickname.value = false
  nicknameError.value = ''
}

async function saveNickname() {
  const login = nicknameInput.value.trim()
  if (!login || login.length < 2 || login.length > 32) {
    nicknameError.value = 'Ник должен быть от 2 до 32 символов'
    return
  }

  isSavingNickname.value = true
  nicknameError.value = ''

  try {
    const response = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ login }),
    })

    if (!response.ok) {
      if (response.status === 409) {
        nicknameError.value = 'Этот ник уже занят'
      } else {
        nicknameError.value = 'Ошибка при сохранении'
      }
      return
    }

    await userStore.refetchUser()
    isEditingNickname.value = false
  } catch {
    nicknameError.value = 'Ошибка при сохранении'
  } finally {
    isSavingNickname.value = false
  }
}
</script>
```

- [ ] **Step 3: Update ProfilePageContent template**

Replace the entire `<template>` in `ProfilePageContent.vue` with:

```vue
<template>
  <div class="container py-8 flex flex-col gap-8 h-full">
    <ProfileHeader v-if="userStore.user" :user="userStore.user" />

    <div class="max-w-md space-y-2">
      <div class="text-sm text-muted-foreground">Никнейм</div>
      <div v-if="!isEditingNickname" class="flex items-center gap-2">
        <span class="text-lg font-medium">{{ userStore.user?.login }}</span>
        <Button variant="ghost" size="icon" class="size-8" @click="startEditNickname">
          <Pencil class="size-4" />
        </Button>
      </div>
      <div v-else class="flex items-center gap-2">
        <Input
          v-model="nicknameInput"
          class="max-w-[200px]"
          maxlength="32"
          @keydown.enter="saveNickname"
          @keydown.escape="cancelEditNickname"
        />
        <Button
          variant="ghost"
          size="icon"
          class="size-8"
          :disabled="isSavingNickname"
          @click="saveNickname"
        >
          <Check class="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="size-8"
          :disabled="isSavingNickname"
          @click="cancelEditNickname"
        >
          <X class="size-4" />
        </Button>
      </div>
      <p v-if="nicknameError" class="text-sm text-red-500">{{ nicknameError }}</p>
    </div>

    <ConnectedAccounts />
  </div>
</template>
```

- [ ] **Step 4: Simplify ProfileHeader**

Replace the entire `frontend/src/pages/profile/components/ProfileHeader.vue` with:

```vue
<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { UserEntity } from '@/lib/api'

defineProps<{
  user: UserEntity
}>()
</script>

<template>
  <div class="flex items-center gap-4">
    <Avatar size="base">
      <AvatarImage :src="user.profileImageUrl" :alt="user.login" />
      <AvatarFallback>{{ user.login.charAt(0).toUpperCase() }}</AvatarFallback>
    </Avatar>

    <h1 class="text-2xl font-bold">{{ user.login }}</h1>
  </div>
</template>
```

- [ ] **Step 5: Run lint**

Run: `bun lint`
Expected: no errors

---

### Task 7: Frontend — Remove profile link from AdminPage

**Files:**

- Modify: `frontend/src/pages/admin/AdminPage.vue:107-112`

**Interfaces:**

- None (UI-only change)

- [ ] **Step 1: Replace RouterLink with plain Avatar**

In `frontend/src/pages/admin/AdminPage.vue`, replace lines 106-112:

```vue
<RouterLink :to="`${ROUTER_PATHS.profile}/${user.id}`">
                <Avatar class="size-12">
                  <AvatarImage :src="getImageUrl(user.profileImageUrl)" :alt="user.login" />
                  <AvatarFallback>{{ user.login.charAt(0).toUpperCase() }}</AvatarFallback>
                </Avatar>
              </RouterLink>
```

with:

```vue
<Avatar class="size-12">
                <AvatarImage :src="getImageUrl(user.profileImageUrl)" :alt="user.login" />
                <AvatarFallback>{{ user.login.charAt(0).toUpperCase() }}</AvatarFallback>
              </Avatar>
```

- [ ] **Step 2: Remove unused `ROUTER_PATHS` import**

Check if `ROUTER_PATHS` is still used elsewhere in `AdminPage.vue`. If not, remove the import:

```ts
import { ROUTER_PATHS } from '@/router/router-paths'
```

- [ ] **Step 3: Run lint**

Run: `bun lint`
Expected: no errors

---

### Task 8: Verify and regenerate API types

**Files:**

- Auto-generates: `frontend/src/lib/api.ts`

**Interfaces:**

- Consumes: backend changes from Tasks 1-3
- Produces: `LikeEntity` with `user` field in auto-generated API client

- [ ] **Step 1: Start backend and regenerate API types**

Run: `cd backend && bun run dev` (let it start, then stop)
Or run swagger generation directly if available.

The auto-generated `frontend/src/lib/api.ts` will pick up the new `user` field in `LikeEntity` on next frontend dev start.

- [ ] **Step 2: Run full lint**

Run: `bun lint`
Expected: no errors

- [ ] **Step 3: Run format check**

Run: `bun format:check`
Expected: no errors (or auto-fix with `bun format`)

---

### Task 9: Final verification

- [ ] **Step 1: Start dev environment**

Run: `docker compose -f docker-compose-dev.yml up -d`
Run: `cd backend && bun prisma generate && bun prisma migrate dev`
Run: `bun dev`

- [ ] **Step 2: Manual verification checklist**

1. Open suggestion page → hover over like button → tooltip shows users with avatars
2. Click like → tooltip updates with your user
3. Click unlike → your user removed from tooltip
4. Navigate to `/db/profile` → shows own profile with nickname editing + connected accounts
5. Suggestion card author → avatar + name shown, no link
6. Admin page → user avatars shown, no links to profiles
7. Login dropdown → "Профиль" link still works → goes to own profile

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add likes tooltip and make profile private

- Show who liked a suggestion via tooltip on hover
- Make profile page owner-only (remove :userId param)
- Remove all links to other users' profiles
"
```
