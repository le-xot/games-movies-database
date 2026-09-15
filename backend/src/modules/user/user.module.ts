import { Module } from '@nestjs/common'
import { DrizzleModule } from '@/database/drizzle.module'
import { AvatarModule } from '@/modules/avatar/avatar.module'
import { CustomJwtModule } from '@/modules/jwt/jwt.module'
import { DrizzleUserRepository } from '@/modules/user/repositories/drizzle-user.repository'
import { UserRepository } from '@/modules/user/repositories/user.repository'
import { UserController } from '@/modules/user/user.controller'
import { UserService } from '@/modules/user/user.service'
import { WebsocketModule } from '@/modules/websocket/websocket.module'

@Module({
  imports: [CustomJwtModule, DrizzleModule, WebsocketModule, AvatarModule],
  providers: [UserService, { provide: UserRepository, useClass: DrizzleUserRepository }],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
