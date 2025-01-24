import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { UserEntity } from '../user/user.entity'

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    return request.user as UserEntity
  },
)
