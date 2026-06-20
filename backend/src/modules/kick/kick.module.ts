import { Module } from '@nestjs/common'
import { KickService } from '@/modules/kick/kick.service'

@Module({
  providers: [KickService],
  exports: [KickService],
})
export class KickModule {}
