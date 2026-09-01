export const RATE_LIMIT_TTL = 60_000

export const RATE_LIMITS = {
  public: { ttl: RATE_LIMIT_TTL, limit: 1000 },
  auth: { ttl: RATE_LIMIT_TTL, limit: 5 },
  write: { ttl: RATE_LIMIT_TTL, limit: 20 },
  like: { ttl: RATE_LIMIT_TTL, limit: 60 },
  suggestion: { ttl: RATE_LIMIT_TTL, limit: 20 },
  img: { ttl: RATE_LIMIT_TTL, limit: 3000 },
  spotify: { ttl: RATE_LIMIT_TTL, limit: 20 },
  twir: { ttl: RATE_LIMIT_TTL, limit: 120 },
} as const

export type RateLimitConfig = { ttl: number; limit: number }
