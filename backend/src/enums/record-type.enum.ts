export const RecordType = {
  WRITTEN: 'WRITTEN',
  SUGGESTION: 'SUGGESTION',
  AUCTION: 'AUCTION',
  ORDER: 'ORDER',
} as const

export type RecordType = (typeof RecordType)[keyof typeof RecordType]
