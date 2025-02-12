import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Request } from 'express'
import { env } from 'src/utils/enviroments'
import { UserService } from '../user/user.service'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService, private userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const token = this.extractToken(request)
    if (!token) {
      throw new UnauthorizedException()
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: env.JWT_SECRET,
      })
      request.user = await this.userService.getUserById(payload.id)
    } catch {
      throw new UnauthorizedException()
    }
    return true
  }

  private extractToken(request: Request): string | undefined {
    return request.cookies.token
  }
}
