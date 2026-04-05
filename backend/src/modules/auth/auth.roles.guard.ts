import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common'
import { UserRole } from '@/enums'

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name)

  constructor(private roles: UserRole[]) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const user = request.user
    const allowed = this.roles.includes(user.role)
    if (!allowed) this.logger.warn(`Access denied for user=${user?.id} role=${user?.role}`)
    return allowed
  }
}
