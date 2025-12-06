import { UserRole } from "@/lib/api"
import { useMutation, useQuery } from "@pinia/colada"
import { acceptHMRUpdate, defineStore } from "pinia"
import { computed, ref } from "vue"
import { useApi } from "./use-api"

export const USER_QUERY_KEY = "user"

export const useUser = defineStore("globals/use-user", () => {
  const api = useApi()
  const isInitialized = ref(false)

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
      } catch {
        return null
      }
    },
  })

  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === UserRole.ADMIN)
  const currentUserId = computed(() => user.value?.id)

  const fetchUser = async () => {
    try {
      await refetchUser()
    } finally {
      isInitialized.value = true
    }
    return user.value
  }

  const { mutateAsync: userLogin } = useMutation({
    key: [USER_QUERY_KEY, "login"],
    mutation: (input: { code: string }) => {
      return api.auth.authControllerTwitchAuthCallback(input)
    },
    onSuccess: () => refetchUser(),
  })

  const { mutateAsync: userLogout } = useMutation({
    key: [USER_QUERY_KEY, "logout"],
    mutation: async () => {
      return await api.auth.authControllerLogout()
    },
    onSuccess: () => refetchUser(),
  })

  const userRole = computed(() => user.value?.role)

  return {
    isLoading,
    user,
    userRole,
    isLoggedIn,
    isAdmin,
    isInitialized,
    currentUserId,
    fetchUser,
    userLogin,
    userLogout,
    refetchUser,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUser, import.meta.hot))
}
