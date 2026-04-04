import { createTableStore } from '@/composables/factories/create-table-store';
import { useCartoon } from './use-cartoon';
import { useCartoonParams } from './use-cartoon-params';

export const useCartoonTable = createTableStore({
  storeId: 'cartoon/use-cartoon-table',
  dataStore: useCartoon,
  paramsStore: useCartoonParams,
  hasEpisodeColumn: true,
  titleSize: { admin: 47, user: 52 },
  episodeSize: 8,
  deleteConfirmTitle: 'Удалить мультик?',
  itemsKey: 'videos',
});
