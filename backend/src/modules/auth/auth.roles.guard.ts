import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { $Enums } from '@prisma/client'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private roles: $Enums.UserRole[]) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const user = request.user
    return this.roles.includes(user.role)
  }
}
