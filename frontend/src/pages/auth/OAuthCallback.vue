<script setup lang="ts">
import { Loader2 } from '@lucide/vue'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { ROUTER_PATHS } from '@/router/router-paths'
import { useApi } from '@/stores/use-api'
import { useUser } from '@/stores/use-user'

interface ProviderConfig {
  cookieName: string
  name: string
  link: (code: string, state: string) => Promise<unknown>
  login: (code: string, state: string) => Promise<unknown>
}

const api = useApi()
const userApi = useUser()
const route = useRoute()
const router = useRouter()

const providers: Record<string, ProviderConfig> = {
  twitch: {
    cookieName: 'twitch_linking',
    name: 'Twitch',
    link: async (code, state) => {
      try {
        await api.auth.authControllerLinkTwitch({ code, state })
      } catch {
        throw new Error('Не удалось привязать Twitch')
      }
    },
    login: (code, state) => userApi.userLogin({ code, state }),
  },
  kick: {
    cookieName: 'kick_linking',
    name: 'Kick',
    link: async (code, state) => {
      try {
        await api.auth.authControllerLinkKick({ code, state })
      } catch {
        throw new Error('Не удалось привязать Kick')
      }
    },
    login: async (code, state) => {
      try {
        await api.auth.authControllerKickAuthCallback({ code, state })
      } catch {
        throw new Error('Ошибка авторизации через Kick')
      }
      await userApi.refetchUser()
    },
  },
}

const error = ref('')
const isLoading = ref(true)

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; max-age=0; path=/`
}

onMounted(async () => {
  const provider = providers[route.meta.provider as string]
  if (!provider) {
    isLoading.value = false
    error.value = 'Неизвестный провайдер авторизации'
    return
  }

  const url = new URL(window.location.href)
  const loginError = url.searchParams.get('error')
  if (loginError) {
    isLoading.value = false
    error.value = loginError
    return
  }

  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  if (typeof code !== 'string' || typeof state !== 'string') {
    isLoading.value = false
    error.value = 'Incorrect code'
    return
  }

  const isLinking = getCookie(provider.cookieName) === '1'
  deleteCookie(provider.cookieName)

  const returnUrl = localStorage.getItem('loginReturnUrl') || ROUTER_PATHS.db

  try {
    if (isLinking) {
      await provider.link(code, state)
      localStorage.removeItem('loginReturnUrl')
      await router.push(returnUrl)
      toast.success('Аккаунт привязан', { description: `${provider.name} привязан к профилю` })
    } else {
      await provider.login(code, state)
      localStorage.removeItem('loginReturnUrl')
      await router.push(returnUrl)
      toast.success('Вход выполнен', { description: `Вы вошли через ${provider.name}` })
    }
  } catch (e) {
    if (e instanceof Error) {
      error.value = e.toString()
    } else {
      error.value = 'Ошибка авторизации'
    }
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div v-if="isLoading" class="flex h-screen items-center justify-center">
    <Loader2 class="size-8 animate-spin text-muted-foreground" />
  </div>
  <div v-else-if="error" class="flex h-screen items-center justify-center bg-zinc-800">
    {{ error }}
  </div>
</template>
