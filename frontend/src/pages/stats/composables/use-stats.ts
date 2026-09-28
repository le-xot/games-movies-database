import { useQuery } from '@pinia/colada'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'
import { STATS_QUERY_KEY } from '@/composables/query-keys'
import { useApi } from '@/stores/use-api'
import { parseApiError } from '@/utils/api-error'
import type { RecordsStatsDTO } from '@/lib/api'

export const useStats = defineStore('stats/use-stats', () => {
  const api = useApi()
  const error = ref<string | null>(null)

  const {
    data: stats,
    isLoading,
    refetch,
  } = useQuery<RecordsStatsDTO>({
    key: [STATS_QUERY_KEY],
    query: async () => {
      try {
        error.value = null
        const { data } = await api.stats.statsControllerGetRecordsStats()
        return data
      } catch (err) {
        error.value = await parseApiError(err, 'Failed to load stats')
        throw err
      }
    },
  })

  return { stats, isLoading, error, refetch }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStats, import.meta.hot))
}
