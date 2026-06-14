import { ThirdPartService } from '@/enums'
import { SpotifyTokenDomain } from '../entities/spotify-token.entity'

export abstract class SpotifyTokenRepository {
  abstract findByService(service: ThirdPartService): Promise<SpotifyTokenDomain | null>
  abstract upsert(
    service: ThirdPartService,
    data: { accessToken: string; refreshToken: string; obtainedAt: Date; expiresAt: Date },
  ): Promise<SpotifyTokenDomain>
  abstract update(
    service: ThirdPartService,
    data: { accessToken: string; refreshToken: string; obtainedAt: Date; expiresAt: Date },
  ): Promise<SpotifyTokenDomain>
}
