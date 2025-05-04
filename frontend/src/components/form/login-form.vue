<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useUser } from '@/composables/use-user.ts'
import { LogOutIcon } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

const userStore = useUser()
const { user } = storeToRefs(userStore)
const loginHref = `${window.location.origin}/api/auth/twitch`
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
          Админка
        </RouterLink>
      </DropdownMenuItem>
      <DropdownMenuItem @click="userStore.userLogout">
        <LogOutIcon class="size-4 mr-2" />
        Logout
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

  <Button v-else as="a" :href="loginHref">
    Login
  </Button>
</template>
