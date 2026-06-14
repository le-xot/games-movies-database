import { Module } from '@nestjs/common'
import { PrismaModule } from '@/database/prisma.module'
import { SpotifyQueueService } from '@/modules/spotify/spotify-queue.service'
import { SpotifyController } from '@/modules/spotify/spotify.controller'
import { SpotifyService } from '@/modules/spotify/spotify.service'
import { UserModule } from '@/modules/user/user.module'
import { SpotifyTokenRepository } from './repositories/spotify-token.repository'
import { PrismaSpotifyTokenRepository } from './repositories/prisma-spotify-token.repository'

@Module({
  imports: [PrismaModule, UserModule],
  providers: [
    SpotifyService,
    SpotifyQueueService,
    { provide: SpotifyTokenRepository, useClass: PrismaSpotifyTokenRepository },
  ],
  controllers: [SpotifyController],
})
export class SpotifyModule {}
