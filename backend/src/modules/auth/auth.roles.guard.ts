import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common'
import { $Enums } from '@prisma/client'

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name)

  constructor(private roles: $Enums.UserRole[]) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const user = request.user
    const allowed = this.roles.includes(user.role)
    if (!allowed) this.logger.warn(`Access denied for user=${user?.id} role=${user?.role}`)
    return allowed
  }
}
