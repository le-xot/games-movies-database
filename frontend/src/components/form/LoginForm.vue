<script setup lang="ts">
import { CircleUserRound, Loader2, Lock, LogOutIcon, Tv } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { nextTick, ref } from 'vue'
import { TwitchIcon } from 'vue3-simple-icons'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useUser } from '@/stores/use-user'

const userStore = useUser()
const { user } = storeToRefs(userStore)
const isLoading = ref(false)

async function handleLogin(platform: 'twitch' | 'kick') {
  localStorage.setItem('loginReturnUrl', window.location.pathname)
  isLoading.value = true
  await nextTick()
  window.location.href = `${window.location.origin}/api/auth/${platform}`
}
</script>

<template>
  <DropdownMenu v-if="user">
    <DropdownMenuTrigger>
      <div class="flex items-center justify-between gap-2">
        <span class="text-base">
          {{ user.login }}
        </span>
        <Avatar class="size-8">
          <AvatarImage :src="user.profileImageUrl" alt="@radix-vue" />
          <AvatarFallback>{{ user.login.charAt(0) }}</AvatarFallback>
        </Avatar>
      </div>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="mt-4">
      <DropdownMenuItem v-if="userStore.isAdmin" as-child>
        <RouterLink to="/db/admin">
          <Lock class="size-6 mr-2" />
          Админка
        </RouterLink>
      </DropdownMenuItem>
      <DropdownMenuItem v-if="userStore.isLoggedIn" as-child>
        <RouterLink to="/db/profile">
          <CircleUserRound class="size-6 mr-2" />
          Профиль
        </RouterLink>
      </DropdownMenuItem>
      <DropdownMenuItem @click="userStore.userLogout">
        <LogOutIcon class="size-6 mr-2" />
        Выйти
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

  <DropdownMenu v-else>
    <DropdownMenuTrigger as-child>
      <Button :disabled="isLoading">
        <Loader2 v-if="isLoading" class="animate-spin" />
        <span v-else>Логин</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="mt-4">
      <DropdownMenuItem @click="handleLogin('twitch')">
        <TwitchIcon class="size-4 mr-2" />
        <span>Twitch</span>
      </DropdownMenuItem>
      <DropdownMenuItem @click="handleLogin('kick')">
        <Tv class="size-4 mr-2" />
        <span>Kick</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
