<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getImageUrl } from '@/utils/image'
import type { UserEntity } from '@/lib/api'

defineProps<{
  user: UserEntity
  isOwnProfile?: boolean
}>()
</script>

<template>
  <div class="flex items-center gap-4">
    <Avatar class="size-16">
      <AvatarImage :src="getImageUrl(user.profileImageUrl)" :alt="user.login" />
      <AvatarFallback>{{ user.login.charAt(0).toUpperCase() }}</AvatarFallback>
    </Avatar>

    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-bold">{{ user.login }}</h1>
      <Badge v-if="isOwnProfile" variant="secondary" class="w-fit font-normal"> Мой профиль </Badge>
    </div>
  </div>
</template>
