<script setup lang="ts">
import { Trash2Icon } from '@lucide/vue'
import { useTitle } from '@vueuse/core'
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useDialog } from '@/components/dialog/composables/use-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserEntity } from '@/lib/api'
import { ROUTER_PATHS } from '@/router/router-paths'
import { useApi } from '@/stores/use-api'
import { getImageUrl } from '@/utils/image'

interface UserAccount {
  id: number
  userId: string
  platform: 'TWITCH' | 'KICK'
  platformUserId: string
  platformLogin: string
  platformAvatar: string | null
  createdAt: string
}

const title = useTitle()
onMounted(() => (title.value = 'Админка'))

const api = useApi()
const dialog = useDialog()
const users = ref<UserEntity[]>([])
const accounts = ref<Record<string, UserAccount[]>>({})
const isLoading = ref(true)

const platformLabels: Record<string, string> = {
  TWITCH: 'Twitch',
  KICK: 'Kick',
}

onMounted(async () => {
  await fetchUsers()
})

async function fetchUsers() {
  isLoading.value = true
  try {
    const { data } = await api.users.userControllerGetAllUsers()
    users.value = data
    await fetchAllAccounts()
  } catch (error) {
    console.error('Failed to fetch users:', error)
  } finally {
    isLoading.value = false
  }
}

async function fetchAllAccounts() {
  const results = await Promise.allSettled(
    users.value.map(async (user) => {
      const { data } = await api.http.request<UserAccount[], any>({
        path: `/users/${user.id}/accounts`,
        method: 'GET',
      })
      return { userId: user.id, accounts: data }
    }),
  )
  for (const result of results) {
    if (result.status === 'fulfilled') {
      accounts.value[result.value.userId] = result.value.accounts
    }
  }
}

function deleteUser(userId: string, username: string) {
  dialog.openDialog({
    title: 'Удалить пользователя?',
    content: '',
    description: `Вы уверены, что хотите удалить пользователя ${username}?`,
    onSubmit: async () => {
      try {
        await api.users.userControllerDeleteUser(userId)
        await fetchUsers()
      } catch (error) {
        console.error('Failed to delete user:', error)
      }
    },
  })
}
</script>

<template>
  <div class="container">
    <div class="container__items">
      <h1 class="text-2xl font-bold mb-6">Админка</h1>

      <div v-if="isLoading" class="text-center py-4">Загрузка...</div>

      <div v-else class="grid gap-4">
        <h2 class="text-xl font-semibold mb-2">Пользователи</h2>

        <div class="grid gap-4">
          <div
            v-for="user in users"
            :key="user.id"
            class="flex items-center justify-between gap-4 p-4 border rounded-md"
          >
            <div class="flex items-center gap-4">
              <RouterLink :to="`${ROUTER_PATHS.profile}/${user.id}`">
                <Avatar class="size-12">
                  <AvatarImage :src="getImageUrl(user.profileImageUrl)" :alt="user.login" />
                  <AvatarFallback>{{ user.login.charAt(0).toUpperCase() }}</AvatarFallback>
                </Avatar>
              </RouterLink>
              <div>
                <div class="font-medium">
                  {{ user.login }}
                </div>
                <div class="flex gap-1.5 mt-1">
                  <Badge
                    v-for="account in accounts[user.id]"
                    :key="account.id"
                    variant="secondary"
                    class="text-xs"
                  >
                    {{ platformLabels[account.platform] ?? account.platform }}:
                    {{ account.platformLogin }}
                  </Badge>
                  <span v-if="!accounts[user.id]?.length" class="text-xs text-muted-foreground">
                    Нет привязанных аккаунтов
                  </span>
                </div>
                <div class="text-xs text-gray-400 mt-1">{{ user.role }} · ID: {{ user.id }}</div>
              </div>
            </div>
            <Button variant="destructive" size="icon" @click="deleteUser(user.id, user.login)">
              <Trash2Icon class="size-4" color="#ffffff" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
