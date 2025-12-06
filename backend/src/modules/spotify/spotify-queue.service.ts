import { Injectable } from "@nestjs/common"
import { addItemToPlaybackQueue } from "@soundify/web-api"
import { SpotifyService } from "./spotify.service"

@Injectable()
export class SpotifyQueueService {
  constructor(private readonly spotifyService: SpotifyService) {
  }

  // spotify:track:4iV5W9uYEdYUVa79Axb7Rh
  async addToQueue(spotifyUri: string) {
    await addItemToPlaybackQueue(this.spotifyService.client, spotifyUri)
  }
}
