import { useApi } from '@/composables/use-api'
import { UserEntity } from '@/lib/api'
import { createErrorHandler } from '@/utils/error-handler'
import { useQuery } from '@pinia/colada'
import { acceptHMRUpdate, defineStore } from 'pinia'

export const ADMIN_USERS_QUERY_KEY = 'admin-users'

export const useAdminUsers = defineStore('admin/use-admin-users', () => {
  const api = useApi()
  const { error } = createErrorHandler()

  const {
    isLoading,
    data: users,
    refetch: refetchUsers,
  } = useQuery<UserEntity[]>({
    key: [ADMIN_USERS_QUERY_KEY],
    query: async () => {
      try {
        error.value = null
        const { data } = await api.users.userControllerGetAllUsers()
        return data
      } catch (err: any) {
        error.value = err.message || 'Failed to load users'
        console.error('Failed to fetch users:', err)
        throw err
      }
    },
  })

  return {
    isLoading,
    error,
    users,
    refetchUsers,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAdminUsers, import.meta.hot))
}
