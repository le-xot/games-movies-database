import { createGlobalState } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'
import { StatusesEnum } from '../types/api.ts'
import { useApi } from './useApi.ts'
import type { GameEntity } from '../types/api.ts'

export const useGames = createGlobalState(() => {
  const api = useApi()
  const games = ref<GameEntity[]>([])

  onMounted(async () => {
    if (games.value.length)
      return
    try {
      const { data } = await api.games.gameControllerGetAllGames()
      games.value = data
    } catch {
      console.log('ERROR')
    }
  })

  const gamesQueue = computed(() => {
    return games.value.filter(
      games =>
        games.status === StatusesEnum.QUEUE
        || games.status === StatusesEnum.PROGRESS,
    )
  })

  return { games, gamesQueue }
})
