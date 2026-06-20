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
