<script setup lang="ts">
import { Trash2Icon, Tv } from '@lucide/vue'
import { useTitle } from '@vueuse/core'
import { onMounted } from 'vue'
import { TwitchIcon } from 'vue3-simple-icons'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import SteamSyncPanel from '@/pages/admin/components/SteamSyncPanel.vue'
import { useAdminUsers } from '@/pages/admin/composables/use-admin-users'

const title = useTitle()
onMounted(() => (title.value = 'Админка'))

const { users, accounts, isLoading, fetchUsers, deleteUser } = useAdminUsers()

onMounted(async () => {
  await fetchUsers()
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="text-2xl font-bold">Админка</h1>

    <div v-if="isLoading" class="text-center py-8 text-muted-foreground">Загрузка...</div>

    <template v-else>
      <h2 class="text-lg font-semibold text-muted-foreground">Пользователи</h2>

      <div class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,400px),1fr))] gap-4">
        <Card v-for="user in users" :key="user.id">
          <CardContent class="flex items-center gap-4 pt-6">
            <Avatar class="size-10 shrink-0">
              <AvatarImage :src="user.profileImageUrl" :alt="user.login" />
              <AvatarFallback>{{ user.login.charAt(0).toUpperCase() }}</AvatarFallback>
            </Avatar>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-medium truncate">{{ user.login }}</span>
                <Badge :variant="user.role === 'ADMIN' ? 'destructive' : 'default'" class="text-xs">
                  {{ user.role }}
                </Badge>
              </div>

              <div class="flex flex-wrap gap-1.5 mt-2">
                <template v-for="account in accounts[user.id]" :key="account.id">
                  <Badge variant="secondary" class="text-xs gap-1">
                    <TwitchIcon v-if="account.platform === 'TWITCH'" class="size-3" />
                    <Tv v-else class="size-3" />
                    {{ account.platformLogin }}
                  </Badge>
                </template>
                <span v-if="!accounts[user.id]?.length" class="text-xs text-muted-foreground">
                  Нет привязанных аккаунтов
                </span>
              </div>

              <div class="text-xs text-muted-foreground mt-2">ID: {{ user.id }}</div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              class="shrink-0 text-muted-foreground hover:text-destructive"
              @click="deleteUser(user.id, user.login)"
            >
              <Trash2Icon class="size-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <SteamSyncPanel />
    </template>
  </div>
</template>
