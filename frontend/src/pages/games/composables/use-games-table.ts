import { createTableStore } from '@/composables/factories/create-table-store'
import { useGames } from './use-games'
import { useGamesParams } from './use-games-params'

export const useGamesTable = createTableStore({
  storeId: 'games/use-games-table',
  dataStore: useGames,
  paramsStore: useGamesParams,
  hasEpisodeColumn: false,
  titleSize: { admin: 55, user: 60 },
  deleteConfirmTitle: 'Удалить игру?',
  itemsKey: 'games',
})
