import { RolesEnum } from '@/lib/api'
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
        const { data } = await api.auth.authControllerMe()

        return data
      } catch (e) {
        return null
      }
    },
  })

  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === RolesEnum.ADMIN)

  const { mutateAsync: userLogin } = useMutation({
    key: [USER_QUERY_KEY, 'login'],
    mutation: (input: { code: string }) => {
      return api.auth.authControllerTwitchAuthCallback(input)
    },
    onSuccess: () => refetchUser(),
  })

  const { mutateAsync: userLogout } = useMutation({
    key: [USER_QUERY_KEY, 'logout'],
    mutation: async () => {
      return await api.auth.authControllerLogout()
    },
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
