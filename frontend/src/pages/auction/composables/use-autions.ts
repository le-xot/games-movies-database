import { useApi } from '@/composables/use-api'
import { useUser } from '@/composables/use-user'
import { RecordEntity } from '@/lib/api'
import { generateWatchLink } from '@/lib/utils/generate-watch-link'
import { useMutation, useQuery } from '@pinia/colada'
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

export const AUCTION_QUERY_KEY = 'auction'

export const useAuctions = defineStore('queue/use-auction', () => {
  const api = useApi()
  const error = ref<string | null>(null)
  const { isAdmin } = storeToRefs(useUser())

  const {
    isLoading: isLoadingData,
    data,
    refetch: refetchAuctions,
  } = useQuery({
    key: () => [AUCTION_QUERY_KEY],
    query: async () => {
      if (!isAdmin.value) {
        return []
      }

      try {
        error.value = null
        const { data } = await api.auction.auctionControllerGetAuctions()
        return data
      } catch (err: any) {
        error.value = err.message || 'Failed to load suggestions'
        throw err
      }
    },
  })

  const { mutateAsync: approveAuction } = useMutation({
    key: [AUCTION_QUERY_KEY, 'approve'],
    mutation: async (id: number) => {
      try {
        error.value = null
        const response = await api.auction.auctionControllerGetWinner({ id })
        const winner = response.data

        const watchLink = generateWatchLink(winner.link)
        if (watchLink) {
          window.open(watchLink, '_blank')
        }
      } catch (err: any) {
        let errorMessage = 'Неизвестная ошибка'

        try {
          if (err instanceof Response || (err && typeof err.json === 'function')) {
            const errorData = await err.clone().json()
            errorMessage = errorData.message || errorMessage
          } else if (err.error) {
            errorMessage = err.error.message || errorMessage
          } else if (err.message) {
            errorMessage = err.message
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
        }

        error.value = errorMessage
        throw err
      }
    },
    onSettled: () => refetchAuctions(),
  })

  const auctions = computed<RecordEntity[]>(() => {
    if (!data.value) return []
    return data.value
  })

  const isLoading = computed(() => isLoadingData.value)

  return {
    isLoading,
    error,
    auctions,
    refetchAuctions,
    approveAuction,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuctions, import.meta.hot))
}
