<script setup lang="ts">
import { CircleUserRound } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
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
const { user } = storeToRefs(userStore)

const inSidebar = computed(() => props.collapsed !== undefined)
const userRoleLabel = computed(() =>
  user.value?.role === UserRole.ADMIN ? 'Админ' : 'Пользователь',
)
</script>

<template>
  <Button
    v-if="user && inSidebar"
    variant="ghost"
    class="w-full"
    :class="
      collapsed
        ? 'h-10 justify-center px-0'
        : '-ml-1.5 h-10 w-[calc(100%+6px)] justify-start gap-1.5 px-2 hover:bg-white/10'
    "
    @click="accountDialog.openAccount()"
  >
    <Avatar class="size-7">
      <AvatarImage :src="user.profileImageUrl" alt="@radix-vue" />
      <AvatarFallback>{{ user.login.charAt(0) }}</AvatarFallback>
    </Avatar>
    <template v-if="!collapsed">
      <span class="flex min-w-0 flex-col items-start">
        <span class="truncate text-sm font-medium">{{ user.login }}</span>
        <span class="text-xs text-muted-foreground">{{ userRoleLabel }}</span>
      </span>
    </template>
  </Button>

  <Button v-else-if="user" variant="ghost" class="gap-2" @click="accountDialog.openAccount()">
    <span class="text-base">{{ user.login }}</span>
    <Avatar class="size-8">
      <AvatarImage :src="user.profileImageUrl" alt="@radix-vue" />
      <AvatarFallback>{{ user.login.charAt(0) }}</AvatarFallback>
    </Avatar>
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
