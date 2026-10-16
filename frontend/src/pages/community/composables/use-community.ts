import { useQuery } from '@pinia/colada'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, onMounted } from 'vue'
import { useApi } from '@/stores/use-api'
import { useTitle } from '@/stores/use-title'
import type { CommunityMemberEntity } from '@/lib/api'
export const useCommunity = defineStore('community/use-community', () => {
  const api = useApi()
  const { updateTitle } = useTitle()

  const {
    data: members,
    isLoading,
    refetch,
  } = useQuery<CommunityMemberEntity[]>({
    key: ['community'],
    query: async () => (await api.ratings.ratingControllerGetCommunity()).data.members,
  })

  const items = computed(() => members.value ?? [])

  onMounted(() => updateTitle('Комьюнити'))

  return { items, isLoading, refetch }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCommunity, import.meta.hot))
}
