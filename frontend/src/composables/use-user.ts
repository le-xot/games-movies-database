import { RolesEnum } from '@/lib/api.ts'
import { useMutation, useQuery } from '@pinia/colada'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed } from 'vue'
import { useApi } from './use-api'

export const USER_QUERY_KEY = 'user'

export const useUser = defineStore('globals/use-user', () => {
  const api = useApi()

  const {
    isLoading,
    data: user,
    refetch: refetchUser,
  } = useQuery({
    key: [USER_QUERY_KEY],
    query: async () => {
      try {
        const { data } = await api.users.userControllerGetInfo()
        return data
      } catch {
        return null
      }
    },
  })

  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === RolesEnum.ADMIN)

  const { mutateAsync: userLogin } = useMutation({
    key: [USER_QUERY_KEY, 'login'],
    mutation: ({ username, password }: { username: string, password: string }) => {
      return api.auth.authControllerLogin({
        username,
        password,
      })
    },
    onSuccess: () => refetchUser(),
  })

  const { mutateAsync: userLogout } = useMutation({
    key: [USER_QUERY_KEY, 'logout'],
    mutation: () => api.auth.authControllerLogout(),
    onSuccess: () => refetchUser(),
  })

  return {
    isLoading,
    user,
    isLoggedIn,
    isAdmin,
    userLogin,
    userLogout,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUser, import.meta.hot))
}
