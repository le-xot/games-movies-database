import { Module } from '@nestjs/common'
import { PrismaModule } from '@/database/prisma.module'
import { CustomJwtModule } from '@/modules/jwt/jwt.module'
import { PrismaUserRepository } from '@/modules/user/repositories/prisma-user.repository'
import { UserRepository } from '@/modules/user/repositories/user.repository'
import { UserController } from '@/modules/user/user.controller'
import { UserService } from '@/modules/user/user.service'
import { WebsocketModule } from '@/modules/websocket/websocket.module'

@Module({
  imports: [CustomJwtModule, PrismaModule, WebsocketModule],
  providers: [UserService, { provide: UserRepository, useClass: PrismaUserRepository }],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
