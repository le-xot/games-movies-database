<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useApi } from '@/stores/use-api'
import type { WordleNotificationsStatusDTO } from '@/lib/api'

const POLL_INTERVAL_MS = 3000
const POLL_TIMEOUT_MS = 120_000

const api = useApi()

const status = ref<WordleNotificationsStatusDTO | null>(null)
const isLoading = ref(true)
const isConnecting = ref(false)
const isSaving = ref(false)
const isDisconnecting = ref(false)
const pollHint = ref(false)

let pollTimer: ReturnType<typeof setInterval> | null = null
let pollDeadline = 0

onMounted(loadStatus)
onBeforeUnmount(stopPolling)

async function loadStatus() {
  try {
    const response = await api.wordle.wordleNotificationControllerGetStatus()
    status.value = response.data ?? null
  } catch {
    toast.error('Не удалось загрузить настройки уведомлений')
  } finally {
    isLoading.value = false
  }
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  pollHint.value = false
}

async function connect() {
  if (isConnecting.value) return
  isConnecting.value = true
  const tab = window.open('about:blank', '_blank')
  try {
    const response = await api.wordle.wordleNotificationControllerCreateLink()
    const url = response.data?.url
    if (!url) throw new Error('empty link')
    if (tab) tab.location.href = url
    else window.open(url, '_blank')
    pollHint.value = true
    startPolling()
  } catch {
    tab?.close()
    toast.error('Не удалось создать ссылку на бота')
  } finally {
    isConnecting.value = false
  }
}

function startPolling() {
  stopPolling()
  pollHint.value = true
  pollDeadline = Date.now() + POLL_TIMEOUT_MS
  pollTimer = setInterval(async () => {
    if (Date.now() > pollDeadline) {
      stopPolling()
      return
    }
    await loadStatus()
    if (status.value?.connected) {
      stopPolling()
      toast.success('Telegram подключён')
    }
  }, POLL_INTERVAL_MS)
}

async function toggleSlot(key: 'morningEnabled' | 'eveningEnabled', value: boolean) {
  if (!status.value || isSaving.value) return
  const previous = status.value[key]
  isSaving.value = true
  status.value = { ...status.value, [key]: value } as WordleNotificationsStatusDTO
  try {
    const response = await api.wordle.wordleNotificationControllerUpdate(
      key === 'morningEnabled' ? { morningEnabled: value } : { eveningEnabled: value },
    )
    if (response.data) status.value = response.data
  } catch {
    status.value = { ...status.value, [key]: previous } as WordleNotificationsStatusDTO
    toast.error('Не удалось сохранить настройку')
  } finally {
    isSaving.value = false
  }
}

async function disconnect() {
  if (isDisconnecting.value) return
  isDisconnecting.value = true
  try {
    await api.wordle.wordleNotificationControllerRemove()
    if (status.value) {
      status.value = { ...status.value, connected: false, telegramUsername: null }
    }
    toast.success('Уведомления отключены')
  } catch {
    toast.error('Не удалось отключить уведомления')
  } finally {
    isDisconnecting.value = false
  }
}
</script>

<template>
  <div v-if="!isLoading" class="flex flex-col gap-2">
    <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      Уведомления
    </span>

    <div class="overflow-hidden rounded-lg border">
      <div v-if="!status?.available" class="px-4 py-3 text-sm text-muted-foreground">
        Уведомления в Telegram недоступны
      </div>

      <template v-else-if="!status.connected">
        <div class="flex items-center justify-between gap-3 px-4 py-3">
          <div class="min-w-0">
            <div class="text-sm">Напоминания про Вордли</div>
            <div class="text-xs text-muted-foreground">
              Утром и вечером — если серия под угрозой
            </div>
          </div>
          <Button size="sm" :disabled="isConnecting" @click="connect">Подключить</Button>
        </div>
        <template v-if="pollHint">
          <div class="h-px bg-border" />
          <div class="px-4 py-2 text-xs text-muted-foreground">
            Нажми Start в открывшемся чате с ботом
          </div>
        </template>
      </template>

      <template v-else>
        <div class="flex items-center gap-3 px-4 py-3">
          <div class="min-w-0 flex-1">
            <div class="truncate text-sm font-medium">
              {{ status.telegramUsername ? `@${status.telegramUsername}` : 'Telegram подключён' }}
            </div>
            <div class="text-xs text-muted-foreground">Напоминания про Вордли</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            class="text-muted-foreground hover:text-destructive"
            :disabled="isDisconnecting"
            @click="disconnect"
          >
            Отключить
          </Button>
        </div>
        <div class="h-px bg-border" />
        <div class="flex items-center justify-between gap-3 px-4 py-3">
          <span class="text-sm">Утром ({{ status.morningTime }})</span>
          <Switch
            :model-value="status.morningEnabled"
            :disabled="isSaving"
            @update:model-value="toggleSlot('morningEnabled', $event)"
          />
        </div>
        <div class="h-px bg-border" />
        <div class="flex items-center justify-between gap-3 px-4 py-3">
          <span class="text-sm">Вечером ({{ status.eveningTime }})</span>
          <Switch
            :model-value="status.eveningEnabled"
            :disabled="isSaving"
            @update:model-value="toggleSlot('eveningEnabled', $event)"
          />
        </div>
      </template>
    </div>
  </div>
</template>
