<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useUser } from '@/composables/use-user.ts'
import { LogOutIcon, ShieldUser } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

const userStore = useUser()
const { user } = storeToRefs(userStore)
const loginHref = `${window.location.origin}/api/auth/twitch`

function handleLogin() {
  localStorage.setItem('loginReturnUrl', window.location.pathname)
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
    <DropdownMenuContent>
      <DropdownMenuItem v-if="userStore.isAdmin" as-child>
        <RouterLink to="/db/admin">
          <ShieldUser class="size-4 mr-2" />
          Админка
        </RouterLink>
      </DropdownMenuItem>
      <DropdownMenuItem @click="userStore.userLogout">
        <LogOutIcon class="size-4 mr-2" />
        Выйти
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

  <Button v-else @click="handleLogin">
    Логин
  </Button>
</template>
