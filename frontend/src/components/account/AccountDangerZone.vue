<script setup lang="ts">
import { Trash2 } from '@lucide/vue'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUser } from '@/stores/use-user'

const DELETE_PHRASE = 'Да, я хочу удалить свой аккаунт'

const userStore = useUser()
const isConfirming = ref(false)
const confirmText = ref('')
const isDeleting = ref(false)

const canDelete = computed(() => confirmText.value.trim() === DELETE_PHRASE)

function startConfirm() {
  isConfirming.value = true
  confirmText.value = ''
}

function cancelConfirm() {
  isConfirming.value = false
  confirmText.value = ''
}

async function deleteAccount() {
  if (!canDelete.value) return

  isDeleting.value = true
  try {
    const response = await fetch('/api/auth/me', {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!response.ok) {
      toast.error('Не удалось удалить аккаунт')
      return
    }
    await userStore.userLogout()
    window.location.href = '/'
  } catch (error) {
    console.error('Failed to delete account:', error)
    toast.error('Не удалось удалить аккаунт')
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div class="space-y-3 rounded-lg border border-destructive/30 p-4">
    <div class="text-sm font-semibold text-destructive">Опасная зона</div>

    <template v-if="!isConfirming">
      <p class="text-sm text-muted-foreground">
        Удаление аккаунта необратимо.<br />
        Все ваши данные будут удалены.
      </p>
      <Button variant="destructive" @click="startConfirm">
        <Trash2 class="size-4 mr-2" />
        Удалить аккаунт
      </Button>
    </template>

    <template v-else>
      <p class="text-sm text-muted-foreground">
        Напиши
        <span class="font-medium text-foreground">{{ DELETE_PHRASE }}</span>
        , чтобы подтвердить удаление.
      </p>
      <Input v-model="confirmText" :placeholder="DELETE_PHRASE" autocomplete="off" />
      <div class="flex gap-2">
        <Button variant="destructive" :disabled="!canDelete || isDeleting" @click="deleteAccount">
          Удалить навсегда
        </Button>
        <Button variant="ghost" :disabled="isDeleting" @click="cancelConfirm">Отмена</Button>
      </div>
    </template>
  </div>
</template>
