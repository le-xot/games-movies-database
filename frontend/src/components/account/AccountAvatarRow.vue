<script setup lang="ts">
import { Trash2 } from '@lucide/vue'
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { useUser } from '@/stores/use-user'

const userStore = useUser()
const isConfirming = ref(false)
const isDeleting = ref(false)

async function deleteAvatar() {
  isDeleting.value = true

  try {
    const response = await fetch('/api/auth/me/avatar', {
      method: 'DELETE',
      credentials: 'include',
    })

    if (!response.ok) {
      toast.error('Не удалось сбросить аватар')
      return
    }

    await userStore.refetchUser()
    toast.success('Аватар сброшен')
  } catch {
    toast.error('Не удалось сбросить аватар')
  } finally {
    isDeleting.value = false
    isConfirming.value = false
  }
}
</script>

<template>
  <div class="flex items-center justify-between gap-3 px-4 py-3">
    <span class="text-sm">Аватар</span>

    <template v-if="!isConfirming">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Сбросить аватар"
        class="size-7 text-muted-foreground hover:text-destructive"
        @click="isConfirming = true"
      >
        <Trash2 class="size-3.5" />
      </Button>
    </template>
    <span v-else class="flex items-center gap-1">
      <span class="text-xs text-muted-foreground">Сбросить аватар?</span>
      <Button
        variant="ghost"
        size="sm"
        class="h-7 px-2 text-xs text-destructive"
        :disabled="isDeleting"
        @click="deleteAvatar"
      >
        Сбросить
      </Button>
      <Button
        variant="ghost"
        size="sm"
        class="h-7 px-2 text-xs text-muted-foreground"
        :disabled="isDeleting"
        @click="isConfirming = false"
      >
        Отмена
      </Button>
    </span>
  </div>
</template>
