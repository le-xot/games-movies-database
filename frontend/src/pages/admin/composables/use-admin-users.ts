import { ref } from 'vue'
import { useDialog } from '@/components/dialog/composables/use-dialog'
import { useApi } from '@/stores/use-api'
import type { UserEntity } from '@/lib/api'

export interface UserAccount {
  id: number
  userId: string
  platform: 'TWITCH' | 'KICK' | 'TELEGRAM'
  platformUserId: string
  platformLogin: string
  platformAvatar: string | null
  createdAt: string
}

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
        const { data } = await api.users.userControllerGetUserAccounts(user.id, {
          format: 'json',
        } as any)
        return { userId: user.id, accounts: data as unknown as UserAccount[] }
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
