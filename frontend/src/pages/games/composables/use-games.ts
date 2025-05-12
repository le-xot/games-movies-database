import { useApi } from '@/composables/use-api'
import { useRecordCreate } from '@/composables/use-record-create'
import { RecordEntity, RecordUpdateDTO } from '@/lib/api'
import { useMutation, useQuery } from '@pinia/colada'
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useGamesParams } from './use-games-params'

export const GAMES_QUERY_KEY = 'games'

export const useGames = defineStore('games/use-games', () => {
  const api = useApi()
  const {
    pagination,
    gamesParams,
  } = storeToRefs(useGamesParams())

  const {
    isLoading,
    data,
    refetch: refetchGames,
  } = useQuery({
    placeholderData(previousData): { records: RecordEntity[], total: number } {
      if (!previousData) return { records: [], total: 0 }
      return previousData
    },
    key: () => [GAMES_QUERY_KEY, gamesParams.value],
    query: async () => {
      const { data } = await api.records.recordControllerGetAllRecords(gamesParams.value)
      return data
    },
  })
  const totalRecords = computed(() => {
    if (!data.value) return 0
    return data.value.total
  })

  const totalPages = computed(() => {
    if (!data.value) return 0
    return Math.ceil(data.value.total / pagination.value.pageSize)
  })

  const { mutateAsync: updateGame } = useMutation({
    key: [GAMES_QUERY_KEY, 'update'],
    mutation: ({ id, data }: { id: number, data: RecordUpdateDTO }) => {
      return api.records.recordControllerPatchRecord(id, data)
    },
    onSettled: () => refetchGames(),
  })

  const { mutateAsync: deleteGame } = useMutation({
    key: [GAMES_QUERY_KEY, 'delete'],
    mutation: (id: number) => {
      return api.records.recordControllerDeleteRecord(id)
    },
    onSettled: () => refetchGames(),
  })

  const { mutateAsync: createGame } = useMutation({
    key: [GAMES_QUERY_KEY, 'create'],
    mutation: async (link: string) => {
      const { createRecord } = useRecordCreate(GAMES_QUERY_KEY, refetchGames)
      return await createRecord(link)
    },
    onSuccess: () => refetchGames(),
  })

  const games = computed(() => {
    if (!data.value) return []
    return data.value.records
  })

  return {
    isLoading,
    games,
    refetchGames,
    updateGame,
    deleteGame,
    createGame,
    totalRecords,
    totalPages,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGames, import.meta.hot))
}
