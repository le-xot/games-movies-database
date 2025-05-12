import { Module } from '@nestjs/common'
import { PrismaModule } from '../../database/prisma.module'
import { CustomJwtModule } from '../jwt/jwt.module'
import { TwitchModule } from '../twitch/twitch.module'
import { UserController } from './user.controller'
import { UserService } from './user.service'

@Module({
  imports: [CustomJwtModule, PrismaModule, TwitchModule],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
