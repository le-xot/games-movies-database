import { ref } from 'vue'
import { useDialog } from '@/components/dialog/composables/use-dialog'
import { unwrap } from '@/lib/api'
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
  const error = ref<string | null>(null)

  async function fetchUsers() {
    isLoading.value = true
    error.value = null
    try {
      const data = await unwrap(api.users.users.get())
      users.value = data
      await fetchAllAccounts()
    } catch (err) {
      console.error('Failed to fetch users:', err)
      error.value = 'Не удалось загрузить пользователей'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAllAccounts() {
    const results = await Promise.allSettled(
      users.value.map(async (user) => {
        const data = await unwrap(api.users({ id: user.id }).accounts.get())
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
          await api.users({ id: userId }).delete()
          await fetchUsers()
        } catch (err) {
          console.error('Failed to delete user:', err)
        }
      },
    })
  }

  return { users, accounts, isLoading, error, fetchUsers, deleteUser }
}
