import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common'
import { RATE_LIMITS } from '@/utils/rate-limits'
import { RATE_LIMIT_METADATA_KEY } from './rate-limit.constants'
import { RateLimitService } from './rate-limit.service'

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly rateLimitService: RateLimitService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const config = this.getConfig(context)
    const key = `rl:${this.getRoute(context)}:${this.getClientIp(request)}`

    const { allowed, retryAfterSeconds } = await this.rateLimitService.hit(key, config)

    if (!allowed) {
      const response = context.switchToHttp().getResponse()
      response.setHeader('Retry-After', String(retryAfterSeconds))
      throw new HttpException('Превышен лимит запросов', HttpStatus.TOO_MANY_REQUESTS)
    }

    return true
  }

  private getConfig(context: ExecutionContext) {
    return Reflect.getMetadata(RATE_LIMIT_METADATA_KEY, context.getHandler()) ?? RATE_LIMITS.public
  }

  private getRoute(context: ExecutionContext) {
    return `${context.getClass().name}.${context.getHandler().name}`
  }

  private getClientIp(request: { headers?: Record<string, unknown>; ip?: string }) {
    const forwarded = request.headers?.['x-forwarded-for']
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim()
    }
    return request.ip ?? 'unknown'
  }
}
