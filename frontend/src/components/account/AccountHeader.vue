<script setup lang="ts">
import { Camera } from '@lucide/vue'
import { computed, ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import UserAvatar from '@/components/user/UserAvatar.vue'
import { UserRole, unwrap } from '@/lib/api'
import { useApi } from '@/stores/use-api'
import { useUser } from '@/stores/use-user'
import { parseApiError } from '@/utils/api-error'
import type { UserEntity } from '@/lib/api'

const props = defineProps<{
  user: UserEntity
}>()

const api = useApi()
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
    await unwrap(api.auth.me.avatar.post({ file }))
    await userStore.refetchUser()
  } catch (error) {
    avatarError.value = await parseApiError(error, 'Ошибка при загрузке аватарки')
  } finally {
    isUploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}
</script>

<template>
  <div class="flex flex-col items-center gap-2 min-w-0">
    <div class="relative">
      <UserAvatar
        data-testid="account-avatar"
        :profile-image-url="user.profileImageUrl"
        :login="user.login"
        :frame-id="user.avatarFrameId"
        size="size-16"
      />
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

    <div class="text-center min-w-0 max-w-full">
      <div class="text-lg font-semibold break-words">{{ user.login }}</div>
      <Badge variant="secondary" class="mt-1">{{ roleLabel }}</Badge>
    </div>

    <p v-if="avatarError" class="text-xs text-red-500">{{ avatarError }}</p>
  </div>
</template>
