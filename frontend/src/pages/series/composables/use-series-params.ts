import { createParamsStore } from '@/composables/factories/create-params-store';
import { RecordGenre } from '@/lib/api';

export const useSeriesParams = createParamsStore({
  storeId: 'series/use-series-params',
  localStorageKey: 'columnsVisibility:series',
  defaultColumnVisibility: {
    title: true,
    episode: true,
    user: true,
    status: true,
    grade: true,
  },
  genre: RecordGenre.SERIES,
});
