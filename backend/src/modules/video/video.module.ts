import { Module } from '@nestjs/common'
import { PrismaModule } from '../../database/prisma.module'
import { CustomJwtModule } from '../jwt/jwt.module'
import { VideoController } from './video.controller'
import { VideoServices } from './video.service'

@Module({
  imports: [CustomJwtModule, PrismaModule],
  providers: [VideoServices],
  controllers: [VideoController],
})
export class VideoModule {}
