import { Global, Module } from '@nestjs/common'
import { AuthController } from '@/modules/auth/auth.controller'
import { AuthService } from '@/modules/auth/auth.service'
import { KickModule } from '@/modules/kick/kick.module'
import { UserModule } from '@/modules/user/user.module'

@Global()
@Module({
  imports: [UserModule, KickModule],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
