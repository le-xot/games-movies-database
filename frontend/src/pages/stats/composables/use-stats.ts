import { useQuery } from '@pinia/colada'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '@/stores/use-api'
import type { RecordsStatsDTO } from '@/lib/api'

export const STATS_QUERY_KEY = 'stats'

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
      } catch (err: any) {
        error.value = err.message || 'Failed to load stats'
        throw err
      }
    },
  })

  return { stats, isLoading, error, refetch }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStats, import.meta.hot))
}
