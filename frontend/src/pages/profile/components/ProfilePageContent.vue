<script setup lang="ts">
import { Check, Pencil, X } from '@lucide/vue'
import { useTitle } from '@vueuse/core'
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUser } from '@/stores/use-user'
import ConnectedAccounts from './ConnectedAccounts.vue'
import ProfileHeader from './ProfileHeader.vue'

useTitle('Профиль')

const userStore = useUser()

const isEditingNickname = ref(false)
const nicknameInput = ref('')
const nicknameError = ref('')
const isSavingNickname = ref(false)

function startEditNickname() {
  nicknameInput.value = userStore.user?.login ?? ''
  nicknameError.value = ''
  isEditingNickname.value = true
}

function cancelEditNickname() {
  isEditingNickname.value = false
  nicknameError.value = ''
}

async function saveNickname() {
  const login = nicknameInput.value.trim()
  if (!login || login.length < 2 || login.length > 32) {
    nicknameError.value = 'Ник должен быть от 2 до 32 символов'
    return
  }

  isSavingNickname.value = true
  nicknameError.value = ''

  try {
    const response = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ login }),
    })

    if (!response.ok) {
      if (response.status === 409) {
        nicknameError.value = 'Этот ник уже занят'
      } else {
        nicknameError.value = 'Ошибка при сохранении'
      }
      return
    }

    await userStore.refetchUser()
    isEditingNickname.value = false
  } catch {
    nicknameError.value = 'Ошибка при сохранении'
  } finally {
    isSavingNickname.value = false
  }
}
</script>

<template>
  <div class="container py-8 flex flex-col gap-8 h-full">
    <ProfileHeader v-if="userStore.user" :user="userStore.user" />

    <div class="max-w-md space-y-2">
      <div class="text-sm text-muted-foreground">Никнейм</div>
      <div v-if="!isEditingNickname" class="flex items-center gap-2">
        <span class="text-lg font-medium">{{ userStore.user?.login }}</span>
        <Button variant="ghost" size="icon" class="size-8" @click="startEditNickname">
          <Pencil class="size-4" />
        </Button>
      </div>
      <div v-else class="flex items-center gap-2">
        <Input
          v-model="nicknameInput"
          class="max-w-[200px]"
          maxlength="32"
          @keydown.enter="saveNickname"
          @keydown.escape="cancelEditNickname"
        />
        <Button
          variant="ghost"
          size="icon"
          class="size-8"
          :disabled="isSavingNickname"
          @click="saveNickname"
        >
          <Check class="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="size-8"
          :disabled="isSavingNickname"
          @click="cancelEditNickname"
        >
          <X class="size-4" />
        </Button>
      </div>
      <p v-if="nicknameError" class="text-sm text-red-500">{{ nicknameError }}</p>
    </div>

    <ConnectedAccounts />
  </div>
</template>
