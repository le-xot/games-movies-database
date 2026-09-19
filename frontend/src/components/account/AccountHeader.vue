<script setup lang="ts">
import { Camera } from '@lucide/vue'
import { computed, ref } from 'vue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { UserRole } from '@/lib/api'
import { useUser } from '@/stores/use-user'
import type { UserEntity } from '@/lib/api'

const props = defineProps<{
  user: UserEntity
}>()

const userStore = useUser()
const fileInput = ref<HTMLInputElement>()
const isUploading = ref(false)
const avatarError = ref('')

const roleLabel = computed(() => (props.user.role === UserRole.ADMIN ? 'Админ' : 'Пользователь'))

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
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <div class="relative">
      <Avatar class="size-16">
        <AvatarImage :src="user.profileImageUrl" :alt="user.login" />
        <AvatarFallback>{{ user.login.charAt(0).toUpperCase() }}</AvatarFallback>
      </Avatar>
      <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
      <button
        type="button"
        :disabled="isUploading"
        :aria-label="user.hasCustomAvatar ? 'Заменить аватар' : 'Загрузить аватар'"
        class="absolute -right-1 -bottom-1 flex size-7 cursor-pointer items-center justify-center rounded-full border border-background bg-secondary text-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
        @click="triggerFileInput"
      >
        <Camera class="size-3.5" />
      </button>
    </div>

    <div class="text-center">
      <div class="text-lg font-semibold">{{ user.login }}</div>
      <Badge variant="secondary" class="mt-1">{{ roleLabel }}</Badge>
    </div>

    <p v-if="avatarError" class="text-xs text-red-500">{{ avatarError }}</p>
  </div>
</template>
