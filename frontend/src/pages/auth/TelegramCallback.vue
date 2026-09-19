<script setup lang="ts">
import { Loader2 } from '@lucide/vue'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { ROUTER_PATHS } from '@/router/router-paths'
import { useUser } from '@/stores/use-user'

const userApi = useUser()
const router = useRouter()
const route = useRoute()

const error = ref('')
const isLoading = ref(true)

onMounted(async () => {
  const errorParam = route.query.error
  const isLinking = route.query.mode === 'link'

  if (typeof errorParam === 'string' && errorParam) {
    isLoading.value = false
    error.value = errorParam
    return
  }

  try {
    if (isLinking) {
      const returnUrl = localStorage.getItem('loginReturnUrl') || ROUTER_PATHS.db
      localStorage.removeItem('loginReturnUrl')
      await router.push(returnUrl)
      toast.success('Аккаунт привязан', { description: 'Telegram привязан к профилю' })
    } else {
      const returnUrl = localStorage.getItem('loginReturnUrl') || ROUTER_PATHS.db
      localStorage.removeItem('loginReturnUrl')
      await userApi.refetchUser()
      await router.push(returnUrl)
      toast.success('Вход выполнен', { description: 'Вы вошли через Telegram' })
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка авторизации'
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
