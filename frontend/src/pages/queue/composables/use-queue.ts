import { useApi } from '@/composables/use-api'
import { QueueDto } from '@/lib/api'
import { useQuery } from '@pinia/colada'
import { defineStore } from 'pinia'

export const QUEUE_QUERY_KEY = 'queue'

export const useQueue = defineStore('queue/use-queue', () => {
  const api = useApi()

  const {
    isLoading,
    data,
  } = useQuery<QueueDto>({
    key: [QUEUE_QUERY_KEY],
    query: async () => {
      const { data } = await api.queue.queueControllerGetQueue()
      return data
    },
  })

  return {
    isLoading,
    data,
  }
})
