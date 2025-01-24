import { Module } from '@nestjs/common'
import { PrismaModule } from '../../database/prisma.module'
import { CustomJwtModule } from '../jwt/jwt.module'
import { UserController } from './user.controller'
import { UserService } from './user.service'

@Module({
  imports: [CustomJwtModule, PrismaModule],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
