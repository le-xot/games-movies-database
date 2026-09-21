<script setup lang="ts">
import { Tv } from '@lucide/vue'
import { TelegramIcon, TwitchIcon } from 'vue3-simple-icons'
import { Badge } from '@/components/ui/badge'
import type { UserAccount } from '@/pages/admin/composables/use-admin-users'

defineProps<{
  account: UserAccount
}>()
</script>

<template>
  <Badge variant="secondary" class="gap-1 text-xs">
    <TwitchIcon v-if="account.platform === 'TWITCH'" class="size-3" />
    <TelegramIcon v-else-if="account.platform === 'TELEGRAM'" class="size-3" />
    <Tv v-else class="size-3" />
    {{ account.platformLogin }}
  </Badge>
</template>
