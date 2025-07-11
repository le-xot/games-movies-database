import { Global, Module } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { TwitchService } from '../twitch/twitch.service'
import { UserModule } from '../user/user.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

@Global()
@Module({
  imports: [UserModule],
  providers: [PrismaService, AuthService, TwitchService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
