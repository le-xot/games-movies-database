import { Global, Module } from '@nestjs/common'
import { KickService } from '@/modules/kick/kick.service'

@Global()
@Module({
  providers: [KickService],
  exports: [KickService],
})
export class KickModule {}
