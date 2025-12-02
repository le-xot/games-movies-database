<script setup lang="ts">
import { useDialog } from '@/components/dialog/composables/use-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApi } from '@/composables/use-api'
import { UserEntity } from '@/lib/api'
import { useTitle } from '@vueuse/core'
import { PlusIcon, Trash2Icon } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'

const title = useTitle()
onMounted(() => title.value = 'Админка')

const api = useApi()
const dialog = useDialog()
const users = ref<UserEntity[]>([])
const isLoading = ref(true)
const newUsername = ref('')
const isCreatingUser = ref(false)
const errorMessage = ref('')

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

async function createUser() {
  if (!newUsername.value.trim() || isCreatingUser.value) return

  errorMessage.value = ''
  isCreatingUser.value = true
  try {
    await api.users.userControllerCreateUserByLogin({ login: newUsername.value })
    await fetchUsers()
    newUsername.value = ''
  } catch (error) {
    console.error('Failed to create user:', error)
    errorMessage.value = 'Не удалось создать пользователя. Проверьте правильность ника Twitch.'
  } finally {
    isCreatingUser.value = false
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
              @keyup.enter="createUser"
            />
            <Button
              :disabled="isCreatingUser || !newUsername.trim()"
              @click="createUser"
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
              <Trash2Icon class="size-4" color="#ffffff" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
