import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UserService } from '@/modules/user/user.service'
import { env } from '@/utils/enviroments'
import type { AuthenticatedRequest, RequestWithCookies } from '@/types/authenticated-request'

/**
 * Like AuthGuard, but never rejects: attaches `request.user` when the `token`
 * cookie holds a valid session, otherwise lets the request through as a guest.
 * For public endpoints that personalize (not gate) their response.
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const token = this.extractToken(request)
    if (!token) return true

    try {
      const payload = await this.jwtService.verifyAsync<{ id: string }>(token, {
        secret: env.JWT_SECRET,
      })
      const user = await this.userService.getUserById(payload.id)
      if (user) request.user = user
    } catch {
      // Invalid or expired token: stay a guest, keep the endpoint public.
    }
    return true
  }

  private extractToken(request: RequestWithCookies): string | undefined {
    return request.cookies.token
  }
}
