<script setup lang="ts">
import { CircleUserRound } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import UserAvatar from '@/components/user/UserAvatar.vue'
import UserBadge from '@/components/user/UserBadge.vue'
import { UserRole } from '@/lib/api'
import { useAccountDialog } from '@/stores/use-account-dialog'
import { useLoginDialog } from '@/stores/use-login-dialog'
import { useUser } from '@/stores/use-user'

const props = withDefaults(
  defineProps<{
    collapsed?: boolean
  }>(),
  { collapsed: undefined },
)

const userStore = useUser()
const loginDialog = useLoginDialog()
const accountDialog = useAccountDialog()
const { user, isInitialized } = storeToRefs(userStore)

const inSidebar = computed(() => props.collapsed !== undefined)
const userRoleLabel = computed(() =>
  user.value?.role === UserRole.ADMIN ? 'Админ' : 'Пользователь',
)
</script>

<template>
  <div
    v-if="!isInitialized && inSidebar"
    class="flex h-10 items-center"
    :class="collapsed ? 'w-full justify-center' : 'w-[calc(100%+6px)] -ml-1.5 gap-1.5 px-2'"
  >
    <span class="size-7 shrink-0 animate-pulse rounded-full bg-secondary" />
    <span v-if="!collapsed" class="flex min-w-0 flex-1 flex-col gap-1">
      <span class="h-3 w-20 animate-pulse rounded bg-secondary" />
      <span class="h-2.5 w-12 animate-pulse rounded bg-secondary" />
    </span>
  </div>

  <div v-else-if="!isInitialized" class="flex items-center gap-2">
    <span class="h-4 w-16 animate-pulse rounded bg-secondary" />
    <span class="size-8 animate-pulse rounded-full bg-secondary" />
  </div>

  <Button
    v-else-if="user && inSidebar"
    variant="ghost"
    class="w-full"
    :class="
      collapsed
        ? 'h-10 justify-center px-0'
        : '-ml-1.5 h-10 w-[calc(100%+6px)] justify-start gap-1.5 px-2 hover:bg-white/10'
    "
    @click="accountDialog.openAccount()"
  >
    <UserAvatar
      :profile-image-url="user.profileImageUrl"
      :login="user.login"
      :frame-id="user.avatarFrameId"
      size="size-7"
    />
    <template v-if="!collapsed">
      <span class="flex min-w-0 flex-col items-start">
        <span class="flex items-center gap-1.5">
          <span class="truncate text-sm font-medium">{{ user.login }}</span>
          <UserBadge :badge-id="user.activeBadgeId" />
        </span>
        <span class="text-xs text-muted-foreground">{{ userRoleLabel }}</span>
      </span>
    </template>
  </Button>

  <Button v-else-if="user" variant="ghost" class="gap-2" @click="accountDialog.openAccount()">
    <span class="text-base">{{ user.login }}</span>
    <UserBadge :badge-id="user.activeBadgeId" />
    <UserAvatar
      :profile-image-url="user.profileImageUrl"
      :login="user.login"
      :frame-id="user.avatarFrameId"
      size="size-8"
    />
  </Button>

  <Button
    v-else
    :variant="inSidebar ? 'ghost' : 'default'"
    :size="collapsed ? 'icon' : 'default'"
    :class="[
      collapsed ? 'h-10 w-full justify-center px-0' : '',
      collapsed === false
        ? '-ml-1.5 h-10 w-[calc(100%+6px)] justify-start gap-1.5 px-2 hover:bg-white/10'
        : '',
    ]"
    :aria-label="collapsed ? 'Войти' : undefined"
    @click="loginDialog.openLogin()"
  >
    <CircleUserRound v-if="collapsed" />
    <template v-else-if="collapsed === false">
      <span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary">
        <CircleUserRound />
      </span>
      <span class="truncate text-sm font-medium">Войти</span>
    </template>
    <span v-else>Логин</span>
  </Button>
</template>
