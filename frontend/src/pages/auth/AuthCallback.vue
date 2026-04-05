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

  const returnUrl = localStorage.getItem('loginReturnUrl') || ROUTER_PATHS.db

  try {
    await userApi.userLogin({ code })
    localStorage.removeItem('loginReturnUrl')
    await router.push(returnUrl)
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
