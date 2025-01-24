import { Module } from '@nestjs/common'
import { PrismaModule } from '../../database/prisma.module'
import { UserModule } from '../user/user.module'
import { VideoController } from './video.controller'
import { VideoService } from './video.service'

@Module({
  imports: [PrismaModule, UserModule],
  providers: [VideoService],
  controllers: [VideoController],
})
export class VideoModule {}
