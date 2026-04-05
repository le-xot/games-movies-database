export const LimitType = {
  SUGGESTION: 'SUGGESTION',
} as const

export type LimitType = (typeof LimitType)[keyof typeof LimitType]
