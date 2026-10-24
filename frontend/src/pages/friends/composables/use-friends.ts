import { useQuery } from '@pinia/colada'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { unwrap } from '@/lib/api'
import { useApi } from '@/stores/use-api'
import { parseApiError } from '@/utils/api-error'
import type { FriendsMemberEntity } from '@/lib/api'

export const useFriends = defineStore('friends/use-friends', () => {
  const api = useApi()
  const error = ref<string | null>(null)

  const {
    data: members,
    isLoading,
    refetch,
  } = useQuery<FriendsMemberEntity[]>({
    key: ['friends'],
    query: async () => {
      error.value = null
      try {
        const data = await unwrap(api.ratings.friends.get())
        return data.members
      } catch (err) {
        error.value = await parseApiError(err, 'Не удалось загрузить список друзей')
        throw err
      }
    },
  })

  const items = computed(() => members.value ?? [])

  return { items, isLoading, error, refetch }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFriends, import.meta.hot))
}
