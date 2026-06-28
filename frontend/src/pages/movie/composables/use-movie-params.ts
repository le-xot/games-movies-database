import { createParamsStore } from '@/composables/factories/create-params-store'
import { RecordGenre } from '@/lib/api'

export const useMovieParams = createParamsStore({
  storeId: 'movies/use-movie-params',
  genre: RecordGenre.MOVIE,
})
