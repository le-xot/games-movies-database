export const RecordGrade = {
  DISLIKE: 'DISLIKE',
  BEER: 'BEER',
  LIKE: 'LIKE',
  RECOMMEND: 'RECOMMEND',
} as const

export type RecordGrade = (typeof RecordGrade)[keyof typeof RecordGrade]
