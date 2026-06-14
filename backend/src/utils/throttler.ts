export const THROTTLER_TTL = 60_000

export const THROTTLER_LIMITS = {
  public: { ttl: THROTTLER_TTL, limit: 1000 },
  auth: { ttl: THROTTLER_TTL, limit: 5 },
  write: { ttl: THROTTLER_TTL, limit: 20 },
  like: { ttl: THROTTLER_TTL, limit: 60 },
  suggestion: { ttl: THROTTLER_TTL, limit: 20 },
  img: { ttl: THROTTLER_TTL, limit: 3000 },
  spotify: { ttl: THROTTLER_TTL, limit: 20 },
  twir: { ttl: THROTTLER_TTL, limit: 120 },
} as const
