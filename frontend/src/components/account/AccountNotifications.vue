<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { useApi } from '@/stores/use-api'
import type { WordleNotificationStatus } from '@/lib/api'

const POLL_INTERVAL_MS = 3000
const POLL_TIMEOUT_MS = 120_000

const api = useApi()

const status = ref<WordleNotificationStatus | null>(null)
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
    const response = await api.wordle.notifications.get()
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
    const response = await api.wordle.notifications.link.post()
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
  status.value = { ...status.value, [key]: value } as WordleNotificationStatus
  try {
    const response = await api.wordle.notifications.patch(
      key === 'morningEnabled' ? { morningEnabled: value } : { eveningEnabled: value },
    )
    if (response.data) status.value = response.data
  } catch {
    status.value = { ...status.value, [key]: previous } as WordleNotificationStatus
    toast.error('Не удалось сохранить настройку')
  } finally {
    isSaving.value = false
  }
}

async function disconnect() {
  if (isDisconnecting.value) return
  isDisconnecting.value = true
  try {
    await api.wordle.notifications.delete()
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
  <div class="flex flex-col gap-2">
    <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      Уведомления
    </span>

    <div v-if="isLoading" class="overflow-hidden rounded-lg border">
      <div class="flex items-center justify-between gap-3 px-4 py-3">
        <div class="flex flex-col gap-1.5">
          <Skeleton class="h-3.5 w-36" />
          <Skeleton class="h-3 w-48" />
        </div>
        <Skeleton class="h-6 w-10 rounded-full" />
      </div>
    </div>

    <div v-else class="overflow-hidden rounded-lg border">
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
