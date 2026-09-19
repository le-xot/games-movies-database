<script setup lang="ts">
import { Check, Pencil, X } from '@lucide/vue'
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUser } from '@/stores/use-user'

const userStore = useUser()
const isEditing = ref(false)
const nicknameInput = ref('')
const nicknameError = ref('')
const isSaving = ref(false)

function startEdit() {
  nicknameInput.value = userStore.user?.login ?? ''
  nicknameError.value = ''
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
  nicknameError.value = ''
}

async function saveNickname() {
  const login = nicknameInput.value.trim()
  if (!login || login.length < 2 || login.length > 32) {
    nicknameError.value = 'Ник должен быть от 2 до 32 символов'
    return
  }

  isSaving.value = true
  nicknameError.value = ''

  try {
    const response = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ login }),
    })

    if (!response.ok) {
      nicknameError.value = 'Ошибка при сохранении'
      return
    }

    await userStore.refetchUser()
    isEditing.value = false
    toast.success('Ник сохранён')
  } catch {
    nicknameError.value = 'Ошибка при сохранении'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="flex flex-col">
    <div class="flex items-center justify-between gap-3 px-4 py-3">
      <span class="text-sm">Никнейм</span>

      <span v-if="!isEditing" class="flex items-center gap-1">
        <span class="text-sm text-muted-foreground">{{ userStore.user?.login }}</span>
        <Button variant="ghost" size="icon" class="size-7" @click="startEdit">
          <Pencil class="size-3.5" />
        </Button>
      </span>
      <span v-else class="flex items-center gap-1">
        <Input
          v-model="nicknameInput"
          class="h-7 w-36 text-sm"
          maxlength="32"
          @keydown.enter="saveNickname"
          @keydown.escape="cancelEdit"
        />
        <Button
          variant="ghost"
          size="icon"
          class="size-7"
          :disabled="isSaving"
          @click="saveNickname"
        >
          <Check class="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon" class="size-7" :disabled="isSaving" @click="cancelEdit">
          <X class="size-3.5" />
        </Button>
      </span>
    </div>

    <p v-if="nicknameError" class="px-4 pb-2 text-xs text-red-500">{{ nicknameError }}</p>
  </div>
</template>
