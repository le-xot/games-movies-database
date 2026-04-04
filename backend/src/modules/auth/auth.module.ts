import { Global, Module } from '@nestjs/common'
import { PrismaService } from '@/database/prisma.service'
import { AuthController } from '@/modules/auth/auth.controller'
import { AuthService } from '@/modules/auth/auth.service'
import { TwitchService } from '@/modules/twitch/twitch.service'
import { UserModule } from '@/modules/user/user.module'

@Global()
@Module({
  imports: [UserModule],
  providers: [PrismaService, AuthService, TwitchService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
