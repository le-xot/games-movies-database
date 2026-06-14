export const RecordGenre = {
  GAME: 'GAME',
  MOVIE: 'MOVIE',
  ANIME: 'ANIME',
  CARTOON: 'CARTOON',
  SERIES: 'SERIES',
} as const

export type RecordGenre = (typeof RecordGenre)[keyof typeof RecordGenre]
