import { useMutation, useQuery } from '@pinia/colada'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { assertOk, UserRole } from '@/lib/api'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { useApi } from '@/stores/use-api'

export const USER_QUERY_KEY = 'user'

/** Сколько ждём /me до первого рендера (и в guard роутера). */
export const AUTH_BOOT_TIMEOUT_MS = 1500

export const useUser = defineStore('global/use-user', () => {
  const api = useApi()
  const isInitialized = ref(false)

  const {
    isLoading,
    isPending,
    data: user,
    refetch: refetchUser,
  } = useQuery({
    key: [USER_QUERY_KEY],
    query: async () => {
      try {
        const { data } = await api.auth.me.get()
        return data
      } catch {
        return null
      }
    },
  })

  // Первая попытка /me завершилась (в том числе 401) — дальше `user === null` значит именно «гость».
  watch(isPending, (pending) => {
    if (!pending) isInitialized.value = true
  })

  const isLoggedIn = computed(() => !!user.value)
  const editorEnabled = ref(localStorage.getItem(STORAGE_KEYS.editorEnabled) !== 'false')
  const isRealAdmin = computed(() => user.value?.role === UserRole.ADMIN)
  const isAdmin = computed(() => isRealAdmin.value && editorEnabled.value)
  const currentUserId = computed(() => user.value?.id)

  watch(editorEnabled, (val) => {
    localStorage.setItem(STORAGE_KEYS.editorEnabled, String(val))
  })

  /** Резолвится, когда текущий запрос /me закончился (успех, гость или таймаут). */
  const whenQuerySettled = (timeoutMs = AUTH_BOOT_TIMEOUT_MS) =>
    new Promise<void>((resolve) => {
      if (!isLoading.value) {
        resolve()
        return
      }

      let stop = () => {}
      const finish = () => {
        stop()
        clearTimeout(timer)
        resolve()
      }
      const timer = setTimeout(finish, timeoutMs)
      stop = watch(isLoading, (loading) => {
        if (!loading) finish()
      })
    })

  const fetchUser = async () => {
    try {
      // useQuery стартует загрузку сам при создании стора — не дёргаем /me вторым запросом.
      if (isLoading.value) await whenQuerySettled()
      else await refetchUser()
    } finally {
      isInitialized.value = true
    }
    return user.value
  }

  const { mutateAsync: userLogin } = useMutation({
    key: [USER_QUERY_KEY, 'login'],
    mutation: (input: { code: string; state: string }) => {
      return assertOk(api.auth.twitch.callback.post(input))
    },
    onSuccess: () => refetchUser(),
  })

  const { mutateAsync: userLogout } = useMutation({
    key: [USER_QUERY_KEY, 'logout'],
    mutation: async () => {
      return await assertOk(api.auth.logout.post())
    },
    onSuccess: () => refetchUser(),
  })

  return {
    isLoading,
    isPending,
    user,
    isLoggedIn,
    isAdmin,
    isRealAdmin,
    editorEnabled,
    isInitialized,
    currentUserId,
    fetchUser,
    whenQuerySettled,
    userLogin,
    userLogout,
    refetchUser,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUser, import.meta.hot))
}
