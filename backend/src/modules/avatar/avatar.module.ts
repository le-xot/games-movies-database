import { Module } from '@nestjs/common'
import { AvatarController } from '@/modules/avatar/avatar.controller'
import { AvatarService } from '@/modules/avatar/avatar.service'
import { S3Module } from '@/modules/s3/s3.module'

@Module({
  imports: [S3Module],
  controllers: [AvatarController],
  providers: [AvatarService],
  exports: [AvatarService],
})
export class AvatarModule {}
