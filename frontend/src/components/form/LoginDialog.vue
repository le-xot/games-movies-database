<script setup lang="ts">
import { Loader2, Tv } from '@lucide/vue'
import { ref } from 'vue'
import { TwitchIcon, TelegramIcon } from 'vue3-simple-icons'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useLoginDialog } from '@/stores/use-login-dialog'

type LoginPlatform = 'twitch' | 'kick' | 'telegram'

const loginDialog = useLoginDialog()
const loadingPlatform = ref<LoginPlatform | null>(null)

function handleLogin(platform: LoginPlatform) {
  localStorage.setItem('loginReturnUrl', window.location.pathname)
  loadingPlatform.value = platform
  window.location.href = `${window.location.origin}/api/auth/${platform}`
}
</script>

<template>
  <Dialog v-model:open="loginDialog.isOpen">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>Вход</DialogTitle>
        <DialogDescription>Выбери сервис, через который хочешь войти</DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-2">
        <Button
          variant="secondary"
          class="w-full justify-start gap-2"
          :disabled="loadingPlatform !== null"
          @click="handleLogin('twitch')"
        >
          <Loader2 v-if="loadingPlatform === 'twitch'" class="animate-spin" />
          <TwitchIcon v-else class="size-4" />
          Twitch
        </Button>
        <Button
          variant="secondary"
          class="w-full justify-start gap-2"
          :disabled="loadingPlatform !== null"
          @click="handleLogin('kick')"
        >
          <Loader2 v-if="loadingPlatform === 'kick'" class="animate-spin" />
          <Tv v-else class="size-4" />
          Kick
        </Button>
        <Button
          variant="secondary"
          class="w-full justify-start gap-2"
          :disabled="loadingPlatform !== null"
          @click="handleLogin('telegram')"
        >
          <Loader2 v-if="loadingPlatform === 'telegram'" class="animate-spin" />
          <TelegramIcon v-else class="size-4" />
          Telegram
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
