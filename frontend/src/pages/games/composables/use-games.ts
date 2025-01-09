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

  const {
    isLoading,
    data,
    refetch: refetchGames,
  } = useQuery<GameEntity[]>({
    key: [GAMES_QUERY_KEY],
    placeholderData: (prev) => prev ?? [],
    query: async () => {
      const { data } = await api.games.gameControllerGetAllGames()
      return data
    },
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

    return data.value.filter((games) => {
      return games.status === StatusesEnum.QUEUE
        || games.status === StatusesEnum.PROGRESS
    })
  })

  const games = computed(() => {
    return search.filterData(data.value ?? [])
  })

  return {
    isLoading,
    games,
    gamesQueue,
    search,
    refetchGames,
    updateGame,
    deleteGame,
    createGame,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGames, import.meta.hot))
}
