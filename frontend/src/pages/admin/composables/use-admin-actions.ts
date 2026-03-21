import { useApi } from '@/composables/use-api'
import { createErrorHandler } from '@/utils/error-handler'
import { useMutation } from '@pinia/colada'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'
import { useAdminUsers } from './use-admin-users'

export const useAdminActions = defineStore('admin/use-admin-actions', () => {
  const api = useApi()
  const { refetchUsers } = useAdminUsers()
  const { error, handleAsync } = createErrorHandler()
  
  const isCreatingUser = ref(false)
  const errorMessage = ref('')

  const { mutateAsync: deleteUserMutation } = useMutation({
    key: ['admin-users', 'delete'],
    mutation: async (userId: string) => {
      return await api.users.userControllerDeleteUser(userId)
    },
  })

  const { mutateAsync: createUserMutation } = useMutation({
    key: ['admin-users', 'create'],
    mutation: async (login: string) => {
      return await api.users.userControllerCreateUserByLogin({ login })
    },
  })

  async function deleteUser(userId: string) {
    return handleAsync(
      async () => {
        await deleteUserMutation(userId)
        await refetchUsers()
      },
      undefined,
      { title: 'Ошибка', description: 'Не удалось удалить пользователя' }
    )
  }

  async function createUser(username: string) {
    if (!username.trim() || isCreatingUser.value) return

    errorMessage.value = ''
    isCreatingUser.value = true
    
    try {
      await createUserMutation(username)
      await refetchUsers()
      return true
    } catch (err) {
      console.error('Failed to create user:', err)
      errorMessage.value = 'Не удалось создать пользователя. Проверьте правильность ника Twitch.'
      return false
    } finally {
      isCreatingUser.value = false
    }
  }

  return {
    error,
    errorMessage,
    isCreatingUser,
    deleteUser,
    createUser,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAdminActions, import.meta.hot))
}
