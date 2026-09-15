import { Module } from '@nestjs/common'
import { DrizzleModule } from '@/database/drizzle.module'
import { AvatarModule } from '@/modules/avatar/avatar.module'
import { DrizzleUserRepository } from '@/modules/user/repositories/drizzle-user.repository'
import { UserController } from '@/modules/user/user.controller'
import { UserService } from '@/modules/user/user.service'

@Module({
  imports: [DrizzleModule, AvatarModule],
  providers: [UserService, DrizzleUserRepository],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
