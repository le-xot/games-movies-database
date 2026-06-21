<script setup lang="ts">
import { Camera, Trash2 } from '@lucide/vue'
import { ref } from 'vue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useUser } from '@/stores/use-user'
import type { UserEntity } from '@/lib/api'

const props = defineProps<{
  user: UserEntity
}>()

const userStore = useUser()
const fileInput = ref<HTMLInputElement>()
const isUploading = ref(false)
const avatarError = ref('')

function triggerFileInput() {
  fileInput.value?.click()
}

async function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  isUploading.value = true
  avatarError.value = ''

  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/auth/me/avatar', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })

    if (!response.ok) {
      avatarError.value = 'Ошибка при загрузке аватарки'
      return
    }

    await userStore.refetchUser()
  } catch {
    avatarError.value = 'Ошибка при загрузке аватарки'
  } finally {
    isUploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

async function deleteAvatar() {
  isUploading.value = true
  avatarError.value = ''

  try {
    const response = await fetch('/api/auth/me/avatar', {
      method: 'DELETE',
      credentials: 'include',
    })

    if (!response.ok) {
      avatarError.value = 'Ошибка при удалении аватарки'
      return
    }

    await userStore.refetchUser()
  } catch {
    avatarError.value = 'Ошибка при удалении аватарки'
  } finally {
    isUploading.value = false
  }
}
</script>

<template>
  <div class="flex items-center gap-4">
    <div class="relative group">
      <Avatar size="lg">
        <AvatarImage :src="user.profileImageUrl" :alt="user.login" />
        <AvatarFallback>{{ user.login.charAt(0).toUpperCase() }}</AvatarFallback>
      </Avatar>
    </div>

    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-bold">{{ user.login }}</h1>
      <div class="flex items-center gap-1">
        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
        <Button
          variant="ghost"
          size="sm"
          class="h-7 px-2 text-xs"
          :disabled="isUploading"
          @click="triggerFileInput"
        >
          <Camera class="size-3 mr-1" />
          {{ (user as any).hasCustomAvatar ? 'Заменить' : 'Загрузить' }}
        </Button>
        <Button
          v-if="(user as any).hasCustomAvatar"
          variant="ghost"
          size="sm"
          class="h-7 px-2 text-xs text-destructive"
          :disabled="isUploading"
          @click="deleteAvatar"
        >
          <Trash2 class="size-3 mr-1" />
          Удалить
        </Button>
      </div>
      <p v-if="avatarError" class="text-xs text-red-500">{{ avatarError }}</p>
    </div>
  </div>
</template>
