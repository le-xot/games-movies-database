import { useApi } from '@/composables/use-api'
import { useMutation, useQuery } from '@pinia/colada'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed } from 'vue'
import { useGamesParams } from './use-games-params'
import type { GetAllGamesResponse, PatchGameDTO } from '@/lib/api.ts'

export const GAMES_QUERY_KEY = 'games'

export const useGames = defineStore('games/use-games', () => {
  const api = useApi()
  const params = useGamesParams()

  const {
    isLoading,
    data,
    refetch: refetchGames,
  } = useQuery({
    placeholderData(previousData): GetAllGamesResponse {
      if (!previousData) return { games: [], total: 0 }
      return previousData
    },
    key: () => [GAMES_QUERY_KEY, params.gamesParams],
    query: async () => {
      const { data } = await api.games.gameControllerGetAllGames(params.gamesParams)
      return data
    },
  })

  const totalRecords = computed(() => {
    if (!data.value) return 0
    return data.value.total
  })

  const totalPages = computed(() => {
    if (!data.value) return 0
    return Math.ceil(data.value.total / params.pagination.pageSize)
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
