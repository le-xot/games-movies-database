import { SpotifyService } from './spotify.service'
import { SpotifyQueueService } from './spotify-queue.service'

@Module({
  providers: [SpotifyService, SpotifyQueueService],
  controllers: [SpotifyController],
})
export class SpotifyModule {

}
