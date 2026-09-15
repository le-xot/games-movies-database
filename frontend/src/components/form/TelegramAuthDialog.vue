<script setup lang="ts">
import { CheckCircle2, ExternalLink, Loader2, XCircle } from '@lucide/vue'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { TelegramIcon } from 'vue3-simple-icons'
import { useDialog } from '@/components/dialog/composables/use-dialog'
import { Button } from '@/components/ui/button'
import { ROUTER_PATHS } from '@/router/router-paths'
import { useUser } from '@/stores/use-user'

const props = withDefaults(defineProps<{ mode?: 'login' | 'link' }>(), { mode: 'login' })
const emit = defineEmits<{ success: [] }>()

const dialog = useDialog()
const userStore = useUser()
const router = useRouter()

const POLL_INTERVAL_MS = 2000
const TIMEOUT_MS = 5 * 60 * 1000

const status = ref<'loading' | 'waiting' | 'success' | 'error'>('loading')
const deepLink = ref('')
const errorMessage = ref('')
let pollTimer: ReturnType<typeof setInterval> | null = null
let deadline = 0

const endpoints = {
  login: { start: '/api/auth/telegram/start', poll: '/api/auth/telegram/poll' },
  link: { start: '/api/auth/telegram/link', poll: '/api/auth/telegram/link/poll' },
} as const

onMounted(start)
onBeforeUnmount(stopPolling)

async function start() {
  status.value = 'loading'
  errorMessage.value = ''
  stopPolling()

  try {
    const response = await fetch(endpoints[props.mode].start, {
      method: 'POST',
      credentials: 'include',
    })
    if (!response.ok) throw new Error('Не удалось начать авторизацию через Telegram')

    const data = await response.json()
    deepLink.value = data.url
    deadline = Date.now() + TIMEOUT_MS
    status.value = 'waiting'
    pollTimer = setInterval(poll, POLL_INTERVAL_MS)
  } catch (error) {
    status.value = 'error'
    errorMessage.value = error instanceof Error ? error.message : 'Ошибка авторизации'
  }
}

async function poll() {
  if (Date.now() > deadline) {
    fail('Ссылка недействительна или истекла. Попробуйте снова.')
    return
  }

  try {
    const response = await fetch(endpoints[props.mode].poll, {
      method: 'POST',
      credentials: 'include',
    })

    if (response.status === 400 || response.status === 410) {
      fail('Ссылка недействительна или истекла. Попробуйте снова.')
      return
    }
    if (!response.ok) return

    const data = await response.json()
    if (data.status !== 'ok') return

    stopPolling()
    status.value = 'success'
    emit('success')

    if (props.mode === 'login') {
      await finishLogin()
      toast.success('Вход выполнен', { description: 'Вы вошли через Telegram' })
    } else {
      toast.success('Аккаунт привязан', { description: 'Telegram привязан к профилю' })
      setTimeout(() => dialog.closeDialog(), 1000)
    }
  } catch {
    // сеть моргнула — продолжаем опрашивать до дедлайна
  }
}

function fail(message: string) {
  stopPolling()
  status.value = 'error'
  errorMessage.value = message
}

async function finishLogin() {
  const returnUrl = localStorage.getItem('loginReturnUrl') || ROUTER_PATHS.db
  localStorage.removeItem('loginReturnUrl')
  await userStore.refetchUser()
  await router.push(returnUrl)
  dialog.closeDialog()
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}
</script>

<template>
  <div class="flex flex-col items-center gap-3 py-2 min-w-[260px]">
    <template v-if="status === 'loading'">
      <Loader2 class="size-8 animate-spin text-muted-foreground" />
      <p class="text-sm text-muted-foreground">Готовим ссылку...</p>
    </template>

    <template v-else-if="status === 'waiting'">
      <TelegramIcon class="size-10 text-[#229ED9]" />
      <p class="text-sm text-muted-foreground text-center">
        Откройте Telegram и нажмите «Start» в боте — вход выполнится автоматически.
      </p>
      <Button as-child>
        <a :href="deepLink" target="_blank" rel="noopener noreferrer">
          <ExternalLink class="size-4 mr-2" />
          Открыть Telegram
        </a>
      </Button>
    </template>

    <template v-else-if="status === 'success'">
      <CheckCircle2 class="size-10 text-green-500" />
      <p class="text-sm">{{ mode === 'login' ? 'Вход выполнен!' : 'Аккаунт привязан!' }}</p>
    </template>

    <template v-else>
      <XCircle class="size-10 text-destructive" />
      <p class="text-sm text-muted-foreground text-center">{{ errorMessage }}</p>
      <div class="flex gap-2">
        <Button variant="secondary" @click="start">Попробовать снова</Button>
        <Button variant="ghost" @click="dialog.closeDialog()">Закрыть</Button>
      </div>
    </template>
  </div>
</template>
