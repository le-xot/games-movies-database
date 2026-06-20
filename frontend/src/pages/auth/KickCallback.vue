<script setup lang="ts">
import { Loader2 } from '@lucide/vue'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTER_PATHS } from '@/router/router-paths'
import { useUser } from '@/stores/use-user'

const userApi = useUser()
const router = useRouter()

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
  const url = new URL(window.location.href)
  const loginError = url.searchParams.get('error')
  if (loginError) {
    isLoading.value = false
    error.value = loginError
    return
  }

  const code = url.searchParams.get('code')
  if (typeof code !== 'string') {
    isLoading.value = false
    error.value = 'Incorrect code'
    return
  }

  const isLinking = getCookie('kick_linking') === '1'
  deleteCookie('kick_linking')

  const returnUrl = localStorage.getItem('loginReturnUrl') || ROUTER_PATHS.db

  try {
    if (isLinking) {
      await fetch('/api/auth/kick/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code }),
      })
      localStorage.removeItem('loginReturnUrl')
      await router.push(ROUTER_PATHS.profile)
    } else {
      const response = await fetch('/api/auth/kick/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code }),
      })

      if (!response.ok) {
        throw new Error('Ошибка авторизации через Kick')
      }

      localStorage.removeItem('loginReturnUrl')
      await userApi.refetchUser()
      await router.push(returnUrl)
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
