import { Module } from '@nestjs/common'
import { DrizzleModule } from '@/database/drizzle.module'
import { SpotifyQueueService } from '@/modules/spotify/spotify-queue.service'
import { SpotifyController } from '@/modules/spotify/spotify.controller'
import { SpotifyService } from '@/modules/spotify/spotify.service'
import { UserModule } from '@/modules/user/user.module'
import { DrizzleSpotifyTokenRepository } from './repositories/drizzle-spotify-token.repository'
import { SpotifyTokenRepository } from './repositories/spotify-token.repository'

@Module({
  imports: [DrizzleModule, UserModule],
  providers: [
    SpotifyService,
    SpotifyQueueService,
    { provide: SpotifyTokenRepository, useClass: DrizzleSpotifyTokenRepository },
  ],
  controllers: [SpotifyController],
})
export class SpotifyModule {}
