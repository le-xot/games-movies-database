<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { useUser } from '@/composables/use-user.ts'
import { LogOutIcon } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'

const userStore = useUser()
const { user } = storeToRefs(userStore)
const loginHref = `${window.location.origin}/api/auth/twitch`
</script>

<template>
  <Button v-if="user" variant="ghost" size="sm" class="flex items-center gap-4" @click="userStore.userLogout">
    <span class="text-base">
      {{ user.login }}
    </span>
    <LogOutIcon class="size-4" />
  </Button>

  <Button v-else as="a" :href="loginHref">
    Login
  </Button>
</template>
