import { usePagination } from '@/components/table/composables/use-pagination'
import { useApi } from '@/composables/use-api'
import { useMutation, useQuery } from '@pinia/colada'
import { refDebounced } from '@vueuse/core'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { GameEntity, PatchGameDTO } from '@/lib/api.ts'

export const GAMES_QUERY_KEY = 'games'

export const useGames = defineStore('games/use-games', () => {
  const api = useApi()
  const search = ref('')
  const debouncedSearch = refDebounced(search, 500)
  const pagination = usePagination()

  const queryGames = computed(() => {
    return {
      page: pagination.value.pageIndex + 1,
      limit: pagination.value.pageSize,
      search: debouncedSearch.value,
      orderBy: 'id',
      direction: 'asc',
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
    placeholderData(previousData) {
      if (!previousData) return { games: [], total: 0 }
      return previousData
    },
    key: () => [GAMES_QUERY_KEY, queryGames.value],
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

  const games = computed(() => {
    if (!data.value) return []
    return data.value.games
  })

  return {
    setQueryGames,
    isLoading,
    games,
    search,
    refetchGames,
    updateGame,
    deleteGame,
    createGame,
    pagination,
    totalRecords,
    totalPages,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGames, import.meta.hot))
}
