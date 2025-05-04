<script setup lang="ts">
import { useDialog } from '@/components/dialog/composables/use-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useApi } from '@/composables/use-api'
import { UserEntity } from '@/lib/api'
import { useTitle } from '@vueuse/core'
import { Trash2Icon } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'

const title = useTitle()
onMounted(() => title.value = 'Админка')

const api = useApi()
const dialog = useDialog()
const users = ref<UserEntity[]>([])
const isLoading = ref(true)

onMounted(async () => {
  await fetchUsers()
})

async function fetchUsers() {
  isLoading.value = true
  try {
    const { data } = await api.users.userControllerGetAllUsers()
    users.value = data
  } catch (error) {
    console.error('Failed to fetch users:', error)
  } finally {
    isLoading.value = false
  }
}

async function deleteUser(userId: string, username: string) {
  dialog.openDialog({
    title: 'Удалить пользователя?',
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
      <h1 class="text-2xl font-bold mb-6">
        Админка
      </h1>

      <div v-if="isLoading" class="text-center py-4">
        Загрузка...
      </div>

      <div v-else class="grid gap-4">
        <h2 class="text-xl font-semibold mb-2">
          Пользователи
        </h2>
        <div class="grid gap-4">
          <div v-for="user in users" :key="user.id" class="flex items-center justify-between gap-4 p-4 border rounded-md">
            <div class="flex items-center gap-4">
              <Avatar class="size-12">
                <AvatarImage :src="user.profileImageUrl" :alt="user.login" />
                <AvatarFallback>{{ user.login.charAt(0).toUpperCase() }}</AvatarFallback>
              </Avatar>
              <div>
                <div class="font-medium">
                  {{ user.login }}
                </div>
                <div class="text-sm text-gray-500">
                  {{ user.role }}
                </div>
                <div class="text-xs text-gray-400">
                  ID: {{ user.id }}
                </div>
              </div>
            </div>
            <Button
              variant="destructive"
              size="icon"
              @click="deleteUser(user.id, user.login)"
            >
              <Trash2Icon class="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
