import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UserService } from '@/modules/user/user.service'
import { env } from '@/utils/enviroments'
import type { AuthenticatedRequest, RequestWithCookies } from '@/types/authenticated-request'

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name)

  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const token = this.extractToken(request)
    if (!token) {
      this.logger.warn(`Unauthorized request: missing token ${request.method} ${request.url}`)
      throw new UnauthorizedException()
    }
    let payload: { id: string }
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: env.JWT_SECRET,
      })
    } catch {
      this.logger.warn(
        `Unauthorized request: token verification failed for ${request.method} ${request.url}`,
      )
      throw new UnauthorizedException()
    }

    const user = await this.userService.getUserById(payload.id)
    if (!user) {
      this.logger.warn(`Unauthorized request: user not found for ${request.method} ${request.url}`)
      throw new UnauthorizedException()
    }

    request.user = user
    return true
  }

  private extractToken(request: RequestWithCookies): string | undefined {
    return request.cookies.token
  }
}
