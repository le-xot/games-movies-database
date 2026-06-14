<script setup lang="ts">
import { Share2 } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ROUTER_PATHS } from '@/router/router-paths'
import type { UserEntity } from '@/lib/api'

const props = defineProps<{
  user: UserEntity
  isOwnProfile?: boolean
}>()

async function copyProfileLink() {
  const url = `${window.location.origin}${ROUTER_PATHS.profile}/${props.user.id}`
  await navigator.clipboard.writeText(url)
  toast('Ссылка скопирована')
}
</script>

<template>
  <div class="flex items-center gap-4">
    <Avatar size="base">
      <AvatarImage :src="user.profileImageUrl" :alt="user.login" />
      <AvatarFallback>{{ user.login.charAt(0).toUpperCase() }}</AvatarFallback>
    </Avatar>

    <div class="flex flex-col gap-1">
      <div class="flex items-center gap-1">
        <h1 class="text-2xl font-bold">{{ user.login }}</h1>
        <Button variant="ghost" size="icon" class="size-7" @click="copyProfileLink">
          <Share2 class="size-4" />
        </Button>
      </div>
      <Badge v-if="isOwnProfile" variant="secondary" class="w-fit font-normal"> Мой профиль </Badge>
    </div>
  </div>
</template>
