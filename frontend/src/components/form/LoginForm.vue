<script setup lang="ts">
import { CircleUserRound, Loader2, Lock, LogOutIcon } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { nextTick, ref } from 'vue'
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
const loginHref = `${window.location.origin}/api/auth/twitch`
const isLoading = ref(false)

async function handleLogin() {
  localStorage.setItem('loginReturnUrl', window.location.pathname)
  isLoading.value = true
  await nextTick()
  window.location.href = loginHref
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

  <Button v-else :disabled="isLoading" @click="handleLogin">
    <Loader2 v-if="isLoading" class="animate-spin" />
    <span v-else>Логин</span>
  </Button>
</template>
