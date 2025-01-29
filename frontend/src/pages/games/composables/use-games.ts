import { usePagination } from '@/components/table/composables/use-pagination'
import { useTableSearch } from '@/components/table/composables/use-table-search'
import { useApi } from '@/composables/use-api'
import { type GameEntity, type PatchGameDTO, StatusesEnum } from '@/lib/api.ts'
import { useMutation, useQuery } from '@pinia/colada'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed } from 'vue'

export const GAMES_QUERY_KEY = 'games'

export const useGames = defineStore('games/use-games', () => {
  const api = useApi()
  const search = useTableSearch()

  const pagination = usePagination()

  const queryGames = computed(() => {
    return {
      page: pagination.value.pageIndex + 1,
      limit: pagination.value.pageSize,
      direction: 'asc',
      orderBy: 'id',
    }
  })

  const setQueryGames = (newQuery: Partial<typeof queryGames.value>) => {
    Object.assign(queryGames.value, newQuery)
  }

  const {
    isLoading,
    data,
    refetch: refetchGames,
  } = useQuery<{ games: GameEntity[], total: number }>({
    key: [GAMES_QUERY_KEY, queryGames.value],
    query: async () => {
      const { data } = await api.games.gameControllerGetAllGames(queryGames.value)
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
    mutation: ({ id, data }: { id: number, data: PatchGameDTO }) => {
      return api.games.gameControllerPatchGame(id, data)
    },
    onSettled: () => refetchGames(),
  })

  const { mutateAsync: deleteGame } = useMutation({
    key: [GAMES_QUERY_KEY, 'delete'],
    mutation: (id: number) => {
      return api.games.gameControllerDeleteGame(id)
    },
    onSettled: () => refetchGames(),
  })

  const { mutateAsync: createGame } = useMutation({
    key: [GAMES_QUERY_KEY, 'create'],
    mutation: async () => {
      return await api.games.gameControllerCreateGame({})
    },
    onSettled: () => refetchGames(),
  })

  const gamesQueue = computed(() => {
    if (!data.value) return []

    return data.value.games.filter((games) => {
      return games.status === StatusesEnum.QUEUE
        || games.status === StatusesEnum.PROGRESS
    })
  })

  const games = computed(() => {
    return search.filterData(data.value?.games ?? [])
  })

  return {
    setQueryGames,
    isLoading,
    games,
    gamesQueue,
    search,
    refetchGames,
    updateGame,
    deleteGame,
    createGame,
    pagination,
    totalPages,
    totalRecords,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGames, import.meta.hot))
}
