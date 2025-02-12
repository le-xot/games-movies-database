<script setup lang="ts">
import { useUser } from '@/composables/use-user'
import { ROUTER_PATHS } from '@/lib/router/router-paths'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const userApi = useUser()
const router = useRouter()

const error = ref('')

onMounted(async () => {
  const url = new URL(window.location.href)
  const loginError = url.searchParams.get('error')
  if (loginError) {
    error.value = loginError
    return
  }

  const code = url.searchParams.get('code')
  if (typeof code !== 'string') {
    error.value = 'Incorrect code'
    return
  }

  try {
    await userApi.userLogin({ code })
    await router.push(ROUTER_PATHS.db)
  } catch (e) {
    if (e instanceof Error) {
      error.value = e.toString()
    }
  }
})
</script>

<template>
  <div v-if="error" class="bg-zinc-800 flex justify-center items-center">
    {{ error }}
  </div>
</template>
