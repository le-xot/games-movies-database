import { ref } from 'vue'
import { useDialog } from '@/components/dialog/composables/use-dialog'
import { useApi } from '@/stores/use-api'
import type { UserAccountEntity, UserEntity } from '@/lib/api'

/** Account row shape shared with the generated API client. */
export type UserAccount = UserAccountEntity

export function useAdminUsers() {
  const api = useApi()
  const dialog = useDialog()
  const users = ref<UserEntity[]>([])
  const accounts = ref<Record<string, UserAccount[]>>({})
  const isLoading = ref(true)

  async function fetchUsers() {
    isLoading.value = true
    try {
      const { data } = await api.users.userControllerGetAllUsers()
      users.value = data
      await fetchAllAccounts()
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAllAccounts() {
    const results = await Promise.allSettled(
      users.value.map(async (user) => {
        const { data } = await api.users.userControllerGetUserAccounts(user.id)
        return { userId: user.id, accounts: data }
      }),
    )
    for (const result of results) {
      if (result.status === 'fulfilled') {
        accounts.value[result.value.userId] = result.value.accounts
      }
    }
  }

  function deleteUser(userId: string, username: string) {
    dialog.openDialog({
      title: 'Удалить пользователя?',
      description: `Вы уверены, что хотите удалить пользователя ${username}?`,
      onSubmit: async () => {
        try {
          await api.users.userControllerDeleteUser(userId)
          await fetchUsers()
        } catch (error) {
          console.error('Failed to delete user:', error)
        }
      },
    })
  }

  return { users, accounts, isLoading, fetchUsers, deleteUser }
}
