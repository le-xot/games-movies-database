<script setup lang="ts">
import { useTitle } from '@vueuse/core'
import { Check, Pencil, Tv, X } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TwitchIcon } from 'vue3-simple-icons'
import { useUser } from '@/stores/use-user'

useTitle('Привязки')

const userStore = useUser()

interface UserAccount {
  platform: string
  platformLogin: string
  platformAvatar: string | null
}

const accounts = ref<UserAccount[]>([])
const isLoading = ref(true)

const hasKick = computed(() => accounts.value.some((a) => a.platform === 'KICK'))
const hasTwitch = computed(() => accounts.value.some((a) => a.platform === 'TWITCH'))

const isEditingNickname = ref(false)
const nicknameInput = ref('')
const nicknameError = ref('')
const isSavingNickname = ref(false)

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

function connectKick() {
  window.location.href = `${window.location.origin}/api/auth/kick/link`
}

function connectTwitch() {
  window.location.href = `${window.location.origin}/api/auth/twitch/link`
}
</script>

<template>
  <div class="flex flex-col gap-6 h-full">
    <h1 class="text-2xl font-bold">Привязки</h1>

    <div v-if="isLoading" class="flex justify-center py-10">
      <div class="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>

    <template v-else>
      <div class="grid gap-4 max-w-md">
        <div class="space-y-2">
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

        <div class="border-t pt-4">
          <div class="text-sm text-muted-foreground mb-3">Подключённые платформы</div>
          <div class="grid gap-3">
            <div
              v-for="account in accounts"
              :key="account.platform"
              class="flex items-center gap-4 p-4 border rounded-md"
            >
              <img
                v-if="account.platformAvatar"
                :src="account.platformAvatar"
                class="size-12 rounded-full"
              />
              <div v-else class="size-12 rounded-full bg-muted flex items-center justify-center">
                <TwitchIcon v-if="account.platform === 'TWITCH'" class="size-6" />
                <Tv v-else class="size-6 text-muted-foreground" />
              </div>
              <div>
                <div class="font-medium text-lg">{{ account.platformLogin }}</div>
                <div class="text-sm text-muted-foreground flex items-center gap-1.5">
                  <TwitchIcon v-if="account.platform === 'TWITCH'" class="size-3.5" />
                  <Tv v-else class="size-3.5" />
                  {{ account.platform }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!hasKick" class="pt-2">
          <Button variant="outline" @click="connectKick">
            Подключить Kick
          </Button>
        </div>

        <div v-if="!hasTwitch" class="pt-2">
          <Button variant="outline" @click="connectTwitch">
            Подключить Twitch
          </Button>
        </div>
      </div>
    </template>
  </div>
</template>
