import { SetMetadata } from '@nestjs/common'
import { RATE_LIMIT_METADATA_KEY } from './rate-limit.constants'
import type { RateLimitConfig } from '@/utils/rate-limits'

export const RateLimit = (config: RateLimitConfig) => SetMetadata(RATE_LIMIT_METADATA_KEY, config)
