import { thirdPartyOauthServiceTokens } from '@gmd/database/schema'
import { Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { DrizzleService } from '@/database/drizzle.service'
import { ThirdPartService } from '@/enums'
import { SpotifyTokenDomain } from '../entities/spotify-token.entity'
import { SpotifyTokenRepository } from './spotify-token.repository'

@Injectable()
export class DrizzleSpotifyTokenRepository extends SpotifyTokenRepository {
  constructor(private readonly drizzle: DrizzleService) {
    super()
  }

  async findByService(service: ThirdPartService): Promise<SpotifyTokenDomain | null> {
    return (
      (await this.drizzle.db.query.thirdPartyOauthServiceTokens.findFirst({
        where: eq(thirdPartyOauthServiceTokens.service, service),
      })) ?? null
    )
  }

  async upsert(
    service: ThirdPartService,
    data: { accessToken: string; refreshToken: string; obtainedAt: Date; expiresAt: Date },
  ): Promise<SpotifyTokenDomain> {
    const payload = { service, ...data }
    const [token] = await this.drizzle.db
      .insert(thirdPartyOauthServiceTokens)
      .values(payload)
      .onConflictDoUpdate({ target: thirdPartyOauthServiceTokens.service, set: payload })
      .returning()
    return token
  }

  async update(
    service: ThirdPartService,
    data: { accessToken: string; refreshToken: string; obtainedAt: Date; expiresAt: Date },
  ): Promise<SpotifyTokenDomain> {
    const [token] = await this.drizzle.db
      .update(thirdPartyOauthServiceTokens)
      .set(data)
      .where(eq(thirdPartyOauthServiceTokens.service, service))
      .returning()
    return token
  }
}
