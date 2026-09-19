<script setup lang="ts">
import { Plus, Tv, Unlink } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { TelegramIcon, TwitchIcon } from 'vue3-simple-icons'
import { Button } from '@/components/ui/button'
import { ACCOUNT_DIALOG_ON_LOAD_KEY } from '@/stores/use-account-dialog'

interface UserAccount {
  platform: string
  platformLogin: string
  platformAvatar: string | null
}

const accounts = ref<UserAccount[]>([])
const isLoading = ref(true)
const confirmingUnlink = ref<string | null>(null)
const isUnlinking = ref(false)

const hasKick = computed(() => accounts.value.some((a) => a.platform === 'KICK'))
const hasTwitch = computed(() => accounts.value.some((a) => a.platform === 'TWITCH'))
const hasTelegram = computed(() => accounts.value.some((a) => a.platform === 'TELEGRAM'))
const canUnlink = computed(() => accounts.value.length > 1)

onMounted(loadAccounts)

async function loadAccounts() {
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
}

function connectAccount(platform: 'kick' | 'twitch' | 'telegram') {
  localStorage.setItem('loginReturnUrl', window.location.pathname)
  sessionStorage.setItem(ACCOUNT_DIALOG_ON_LOAD_KEY, '1')
  window.location.href = `${window.location.origin}/api/auth/${platform}/link`
}

async function unlinkAccount(platform: string) {
  isUnlinking.value = true
  try {
    const response = await fetch(`/api/auth/accounts/${platform}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (response.ok) {
      accounts.value = accounts.value.filter((a) => a.platform !== platform)
      toast.success('Аккаунт отвязан', {
        description: `${platform} отвязан от профиля`,
      })
    } else {
      toast.error('Не удалось отвязать аккаунт')
    }
  } catch (error) {
    console.error('Failed to unlink account:', error)
  } finally {
    isUnlinking.value = false
    confirmingUnlink.value = null
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      Подключённые аккаунты
    </span>

    <div class="overflow-hidden rounded-lg border">
      <div v-if="isLoading" class="px-4 py-3 text-sm text-muted-foreground">Загрузка...</div>
      <div v-else-if="!accounts.length" class="px-4 py-3 text-sm text-muted-foreground">
        Нет привязанных аккаунтов
      </div>
      <template v-else>
        <template v-for="(account, i) in accounts" :key="account.platform">
          <div class="flex items-center gap-3 px-4 py-3">
            <img
              v-if="account.platformAvatar"
              :src="account.platformAvatar"
              class="size-8 rounded-full"
            />
            <div v-else class="flex size-8 items-center justify-center rounded-full bg-muted">
              <TwitchIcon v-if="account.platform === 'TWITCH'" class="size-4" />
              <TelegramIcon v-else-if="account.platform === 'TELEGRAM'" class="size-4" />
              <Tv v-else class="size-4 text-muted-foreground" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-medium">{{ account.platformLogin }}</div>
              <div class="text-xs text-muted-foreground">{{ account.platform }}</div>
            </div>

            <div v-if="canUnlink" class="flex items-center gap-1">
              <template v-if="confirmingUnlink === account.platform">
                <span class="text-xs text-muted-foreground">Отвязать?</span>
                <Button
                  variant="destructive"
                  size="sm"
                  :disabled="isUnlinking"
                  @click="unlinkAccount(account.platform)"
                >
                  Да
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  :disabled="isUnlinking"
                  @click="confirmingUnlink = null"
                >
                  Отмена
                </Button>
              </template>
              <Button
                v-else
                variant="ghost"
                size="icon"
                class="size-7 text-muted-foreground hover:text-destructive"
                @click="confirmingUnlink = account.platform"
              >
                <Unlink class="size-3.5" />
              </Button>
            </div>
          </div>
          <div v-if="i < accounts.length - 1" class="h-px bg-border" />
        </template>
      </template>
    </div>

    <div class="flex flex-wrap gap-2">
      <Button v-if="!hasKick" variant="outline" size="sm" @click="connectAccount('kick')">
        <Plus class="size-3.5 mr-1" />
        Kick
      </Button>
      <Button v-if="!hasTwitch" variant="outline" size="sm" @click="connectAccount('twitch')">
        <Plus class="size-3.5 mr-1" />
        Twitch
      </Button>
      <Button v-if="!hasTelegram" variant="outline" size="sm" @click="connectAccount('telegram')">
        <Plus class="size-3.5 mr-1" />
        Telegram
      </Button>
    </div>
  </div>
</template>
