import { Injectable, Logger } from '@nestjs/common'
import { addItemToPlaybackQueue } from '@soundify/web-api'
import { SpotifyService } from './spotify.service'

@Injectable()
export class SpotifyQueueService {
  private readonly logger = new Logger(SpotifyQueueService.name)
  constructor(private readonly spotifyService: SpotifyService) {
  }

  // spotify:track:4iV5W9uYEdYUVa79Axb7Rh
  async addToQueue(spotifyUri: string) {
    this.logger.log(`Adding spotify uri to queue ${spotifyUri}`)
    await addItemToPlaybackQueue(this.spotifyService.client, spotifyUri)
  }
}
