import { createParamsStore } from '@/composables/factories/create-params-store';
import { RecordGenre } from '@/lib/api';

export const useMovieParams = createParamsStore({
  storeId: 'movies/use-movie-params',
  localStorageKey: 'columnsVisibility:movie',
  defaultColumnVisibility: {
    title: true,
    user: true,
    status: true,
    grade: true,
  },
  genre: RecordGenre.MOVIE,
});
