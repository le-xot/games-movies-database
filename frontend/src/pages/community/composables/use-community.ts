import { useQuery } from '@pinia/colada'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useApi } from '@/stores/use-api'
import { parseApiError } from '@/utils/api-error'
import type { CommunityMemberEntity } from '@/lib/api'

export const useCommunity = defineStore('community/use-community', () => {
  const api = useApi()
  const error = ref<string | null>(null)

  const {
    data: members,
    isLoading,
    refetch,
  } = useQuery<CommunityMemberEntity[]>({
    key: ['community'],
    query: async () => {
      error.value = null
      try {
        const { data } = await api.ratings.ratingControllerGetCommunity()
        return data.members
      } catch (err) {
        error.value = await parseApiError(err, 'Не удалось загрузить комьюнити')
        throw err
      }
    },
  })

  const items = computed(() => members.value ?? [])

  return { items, isLoading, error, refetch }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCommunity, import.meta.hot))
}
