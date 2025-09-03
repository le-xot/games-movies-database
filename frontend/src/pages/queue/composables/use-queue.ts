import { useApi } from '@/composables/use-api'
import { QueueDto } from '@/lib/api'
import { useQuery } from '@pinia/colada'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'

export const QUEUE_QUERY_KEY = 'queue'

export const useQueue = defineStore('queue/use-queue', () => {
  const api = useApi()
  const error = ref<string | null>(null)

  const {
    isLoading,
    data,
    refetch,
  } = useQuery<QueueDto>({
    key: [QUEUE_QUERY_KEY],
    query: async () => {
      try {
        error.value = null
        const { data } = await api.queue.queueControllerGetQueue()
        return data
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
  })

  return {
    isLoading,
    data,
    error,
    refetch,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useQueue, import.meta.hot))
}
