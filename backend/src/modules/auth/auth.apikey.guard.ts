import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { env } from 'src/utils/enviroments'

@Injectable()
export class ApikeyGuard implements CanActivate {
  constructor() {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const apiKey = request.headers['x-api-key']

    if (apiKey !== env.TWIR_API) {
      throw new UnauthorizedException()
    }

    return true
  }
}
