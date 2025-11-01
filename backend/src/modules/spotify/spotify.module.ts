import { PrismaModule } from '@/database/prisma.module'
import { Module } from '@nestjs/common'
import { UserModule } from '../user/user.module'
import { SpotifyController } from './spotify.controller'
import { SpotifyService } from './spotify.service'
import { SpotifyQueueService } from './spotify-queue.service'

@Module({
  imports: [PrismaModule, UserModule],
  providers: [SpotifyService, SpotifyQueueService],
  controllers: [SpotifyController],
})
export class SpotifyModule {

}
