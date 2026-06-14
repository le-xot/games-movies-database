import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import { env } from '@/utils/enviroments'

@Injectable()
export class ApikeyGuard implements CanActivate {
  private readonly logger = new Logger(ApikeyGuard.name)

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const apiKey = request.headers['x-api-key']

    if (apiKey !== env.TWIR_API) {
      this.logger.warn(`Unauthorized apikey access from ${request.ip}`)
      throw new UnauthorizedException()
    }

    return true
  }
}
