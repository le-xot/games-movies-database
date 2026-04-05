import { Module } from '@nestjs/common'
import { PrismaModule } from '@/database/prisma.module'
import { CustomJwtModule } from '@/modules/jwt/jwt.module'
import { TwitchModule } from '@/modules/twitch/twitch.module'
import { UserController } from '@/modules/user/user.controller'
import { UserService } from '@/modules/user/user.service'
import { UserRepository } from '@/modules/user/repositories/user.repository'
import { PrismaUserRepository } from '@/modules/user/repositories/prisma-user.repository'
import { WebsocketModule } from '@/modules/websocket/websocket.module'

@Module({
  imports: [CustomJwtModule, PrismaModule, TwitchModule, WebsocketModule],
  providers: [
    UserService,
    { provide: UserRepository, useClass: PrismaUserRepository },
  ],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
