import { Inject, Injectable } from '@nestjs/common'
import { PrismaService } from '@/database/prisma.service'
import { ThirdPartService } from '@/enums'
import { SpotifyTokenDomain } from '../entities/spotify-token.entity'
import { SpotifyTokenRepository } from './spotify-token.repository'

@Injectable()
export class PrismaSpotifyTokenRepository extends SpotifyTokenRepository {
  constructor(@Inject() private readonly prisma: PrismaService) {
    super()
  }

  async findByService(service: ThirdPartService): Promise<SpotifyTokenDomain | null> {
    return await this.prisma.thirdPartyOauthServiceToken.findUnique({
      where: { service },
    })
  }

  async upsert(
    service: ThirdPartService,
    data: { accessToken: string; refreshToken: string; obtainedAt: Date; expiresAt: Date },
  ): Promise<SpotifyTokenDomain> {
    const payload = { service, ...data }
    return await this.prisma.thirdPartyOauthServiceToken.upsert({
      where: { service },
      create: payload,
      update: payload,
    })
  }

  async update(
    service: ThirdPartService,
    data: { accessToken: string; refreshToken: string; obtainedAt: Date; expiresAt: Date },
  ): Promise<SpotifyTokenDomain> {
    return await this.prisma.thirdPartyOauthServiceToken.update({
      where: { service },
      data,
    })
  }
}
