<script setup lang="ts">
import { Tv, Unlink } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { TwitchIcon } from 'vue3-simple-icons'
import { useDialog } from '@/components/dialog/composables/use-dialog'
import { Button } from '@/components/ui/button'

interface UserAccount {
  platform: string
  platformLogin: string
  platformAvatar: string | null
}

const accounts = ref<UserAccount[]>([])
const isLoading = ref(true)
const dialog = useDialog()

const hasKick = computed(() => accounts.value.some((a) => a.platform === 'KICK'))
const hasTwitch = computed(() => accounts.value.some((a) => a.platform === 'TWITCH'))
const canUnlink = computed(() => accounts.value.length > 1)

onMounted(async () => {
  try {
    const response = await fetch('/api/auth/accounts', {
      credentials: 'include',
    })
    if (response.ok) {
      accounts.value = await response.json()
    }
  } catch (error) {
    console.error('Failed to fetch linked accounts:', error)
  } finally {
    isLoading.value = false
  }
})

function connectKick() {
  window.location.href = `${window.location.origin}/api/auth/kick/link`
}

function connectTwitch() {
  window.location.href = `${window.location.origin}/api/auth/twitch/link`
}

function unlinkAccount(platform: string, platformLogin: string) {
  dialog.openDialog({
    title: 'Отвязать аккаунт?',
    description: `Вы уверены, что хотите отвязать ${platform} аккаунт <b>${platformLogin}</b>?`,
    onSubmit: async () => {
      try {
        const response = await fetch(`/api/auth/accounts/${platform}`, {
          method: 'DELETE',
          credentials: 'include',
        })
        if (response.ok) {
          accounts.value = accounts.value.filter((a) => a.platform !== platform)
        }
      } catch (error) {
        console.error('Failed to unlink account:', error)
      }
    },
  })
}
</script>

<template>
  <div class="space-y-4">
    <h3 class="text-lg font-semibold">Подключённые аккаунты</h3>

    <div v-if="isLoading" class="text-muted-foreground text-sm">Загрузка...</div>

    <div v-else class="space-y-3">
      <div
        v-for="account in accounts"
        :key="account.platform"
        class="flex items-center gap-3 p-3 border rounded-md"
      >
        <img
          v-if="account.platformAvatar"
          :src="account.platformAvatar"
          class="size-10 rounded-full"
        />
        <div v-else class="size-10 rounded-full bg-muted flex items-center justify-center">
          <TwitchIcon v-if="account.platform === 'TWITCH'" class="size-5" />
          <Tv v-else class="size-5 text-muted-foreground" />
        </div>
        <div class="flex-1">
          <div class="font-medium">{{ account.platformLogin }}</div>
          <div class="text-sm text-muted-foreground flex items-center gap-1.5">
            <TwitchIcon v-if="account.platform === 'TWITCH'" class="size-3" />
            <Tv v-else class="size-3" />
            {{ account.platform }}
          </div>
        </div>
        <Button
          v-if="canUnlink"
          variant="ghost"
          size="icon"
          class="size-8 text-muted-foreground hover:text-destructive"
          @click="unlinkAccount(account.platform, account.platformLogin)"
        >
          <Unlink class="size-4" />
        </Button>
      </div>

      <Button v-if="!hasKick" variant="outline" @click="connectKick"> Подключить Kick </Button>
      <Button v-if="!hasTwitch" variant="outline" @click="connectTwitch">
        Подключить Twitch
      </Button>
    </div>
  </div>
</template>
