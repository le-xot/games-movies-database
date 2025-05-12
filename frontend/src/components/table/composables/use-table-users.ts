import { useApi } from '@/composables/use-api'
import { UserUpdateDTO } from '@/lib/api'
import { useMutation, useQuery } from '@pinia/colada'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed } from 'vue'

export const USERS_QUERY_KEY = 'users'

export const useTableUsers = defineStore('use-table-users', () => {
  const api = useApi()
  const {
    isLoading,
    data: users,
    refetch: refetchUsers,
  } = useQuery({
    key: [USERS_QUERY_KEY],
    placeholderData: (prev) => prev ?? [],
    query: async () => {
      const { data } = await api.users.userControllerGetAllUsers()
      return data
    },
  })

  const { mutateAsync: patchUser } = useMutation({
    key: [USERS_QUERY_KEY, 'create'],
    mutation: async (opts: { id: string, data: UserUpdateDTO }) => {
      return await api.users.userControllerPatchUser(opts.id, opts.data)
    },
    onSettled: () => refetchUsers(),
  })

  const { mutateAsync: createUserByLogin } = useMutation({
    key: [USERS_QUERY_KEY, 'create-by-login'],
    mutation: async (login: string) => {
      return await api.users.userControllerCreateUserByLogin({ login })
    },
    onSettled: () => refetchUsers(),
  })

  const { mutateAsync: deletePersonById } = useMutation({
    key: [USERS_QUERY_KEY, 'delete'],
    mutation: async (id: string) => {
      return await api.users.userControllerDeleteUser(id)
    },
    onSettled: () => refetchUsers(),
  })

  const userOptions = computed(() => {
    if (!users.value) return []
    return users.value.map((item) => {
      return {
        id: item.id,
        name: item.login,
        color: item.color,
      }
    })
  })

  return {
    isLoading,
    users,
    userOptions,
    createUserByLogin,
    refetchUsers,
    createOrUpdateUser: patchUser,
    deletePersonById,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTableUsers, import.meta.hot))
}
