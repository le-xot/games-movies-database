import { timingSafeEqual } from 'node:crypto'
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import { env } from '@/utils/enviroments'

export function isApiKeyValid(provided: unknown, expected: string | null | undefined): boolean {
  if (!expected || typeof provided !== 'string' || provided.length !== expected.length) {
    return false
  }
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
}

@Injectable()
export class ApikeyGuard implements CanActivate {
  private readonly logger = new Logger(ApikeyGuard.name)

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()

    if (!isApiKeyValid(request.headers['x-api-key'], env.TWIR_API)) {
      this.logger.warn(`Unauthorized apikey access from ${request.ip}`)
      throw new UnauthorizedException()
    }

    return true
  }
}
