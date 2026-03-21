<script setup lang="ts">
import { useDialog } from '@/components/dialog/composables/use-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getImageUrl } from '@/lib/utils/image.ts'
import { useTitle } from '@vueuse/core'
import { PlusIcon, Trash2Icon } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { useAdminActions } from './composables/use-admin-actions'
import { useAdminUsers } from './composables/use-admin-users'

const title = useTitle()
onMounted(() => title.value = 'Админка')

const dialog = useDialog()
const { users, isLoading } = useAdminUsers()
const { deleteUser, createUser, isCreatingUser, errorMessage } = useAdminActions()

const newUsername = ref('')

function handleDeleteUser(userId: string, username: string) {
  dialog.openDialog({
    title: 'Удалить пользователя?',
    content: '',
    description: `Вы уверены, что хотите удалить пользователя ${username}?`,
    onSubmit: async () => {
      await deleteUser(userId)
    },
  })
}

async function handleCreateUser() {
  const success = await createUser(newUsername.value)
  if (success) {
    newUsername.value = ''
  }
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

        <div class="flex flex-col gap-2 mb-4">
          <div class="flex gap-2">
            <Input
              v-model="newUsername"
              placeholder="Введите ник Twitch"
              class="flex-1"
              @keyup.enter="handleCreateUser"
            />
            <Button
              :disabled="isCreatingUser || !newUsername.trim()"
              @click="handleCreateUser"
            >
              <PlusIcon class="size-4 mr-2" />
              Добавить
            </Button>
          </div>
          <p v-if="errorMessage" class="text-sm text-red-500">
            {{ errorMessage }}
          </p>
        </div>

        <div class="grid gap-4">
          <div v-for="user in users" :key="user.id" class="flex items-center justify-between gap-4 p-4 border rounded-md">
            <div class="flex items-center gap-4">
              <Avatar class="size-12">
                <AvatarImage :src="getImageUrl(user.profileImageUrl)" :alt="user.login" />
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
              @click="handleDeleteUser(user.id, user.login)"
            >
              <Trash2Icon class="size-4" color="#ffffff" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
