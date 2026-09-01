import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { RecordGenre, RecordType } from '@/enums'
import type { RecordWithRelations } from '@/modules/record/entities/record-domain.entity'
import { RecordRepository } from '@/modules/record/repositories/record.repository'
import { RecordsProvidersService } from '@/modules/records-providers/records-providers.service'
import { env } from '@/utils/enviroments'
import type { SteamImportGameDto, SteamGameDto } from './steam.dto'
import type { UpdateRecordsPayload } from '@/modules/websocket/websocket.events'

interface SteamOwnedGamesResponse {
  response: {
    game_count: number
    games: {
      appid: number
      name: string
      playtime_forever: number
      header_image: string
      img_icon_url: string
    }[]
  }
}

@Injectable()
export class SteamService {
  private readonly logger = new Logger(SteamService.name)

  constructor(
    private readonly recordsProvidersService: RecordsProvidersService,
    private readonly recordRepository: RecordRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getOwnedGames(): Promise<SteamGameDto[]> {
    if (!env.STEAM_API_KEY || !env.STEAM_ID) {
      this.logger.warn('STEAM_API_KEY or STEAM_ID not configured')
      return []
    }

    const url = new URL('https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/')
    url.searchParams.set('key', env.STEAM_API_KEY)
    url.searchParams.set('steamid', env.STEAM_ID)
    url.searchParams.set('include_appinfo', '1')
    url.searchParams.set('include_played_free_games', '1')
    url.searchParams.set('format', 'json')

    const response = await fetch(url.toString())
    if (!response.ok) {
      this.logger.error(`Steam API error: ${response.status}`)
      return []
    }

    const data = (await response.json()) as SteamOwnedGamesResponse
    return (data.response.games ?? []).map((game) => ({
      ...game,
      header_image: `https://cdn.akamai.steamstatic.com/${game.header_image}`,
      img_icon_url: `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`,
    }))
  }

  async getExistingAppIds(): Promise<Set<string>> {
    const records = await this.recordRepository.findManyByExtraField('steamAppId')
    return new Set(records.map((r) => (r.extra as Record<string, unknown>)?.steamAppId as string))
  }

  async findDuplicateGames(): Promise<RecordWithRelations[]> {
    return await this.recordRepository.findAll(
      { genre: RecordGenre.GAME },
      {},
      { skip: 0, take: 10000 },
    )
  }

  isDuplicate(
    game: { appid: number; name: string },
    existingGames: RecordWithRelations[],
  ): boolean {
    const appIdStr = String(game.appid)
    const steamLink = `store.steampowered.com/app/${game.appid}`
    const normalizedName = game.name.toLowerCase().trim()

    return existingGames.some((record) => {
      const extra = record.extra as Record<string, unknown> | null
      if (extra?.steamAppId === appIdStr) return true
      if (record.link.includes(steamLink)) return true
      if (record.title.toLowerCase().trim() === normalizedName) return true
      return false
    })
  }

  async importGames(
    games: SteamImportGameDto[],
  ): Promise<{ created: any[]; failed: { appId: number; reason: string }[] }> {
    const existingGames = await this.findDuplicateGames()
    const created: any[] = []
    const failed: { appId: number; reason: string }[] = []

    for (const game of games) {
      const appIdStr = String(game.appId)
      const steamLink = `store.steampowered.com/app/${game.appId}`

      const isDuplicate = existingGames.some((record) => {
        const extra = record.extra as Record<string, unknown> | null
        if (extra?.steamAppId === appIdStr) return true
        if (record.link.includes(steamLink)) return true
        return false
      })

      if (isDuplicate) {
        failed.push({ appId: game.appId, reason: 'Already exists in database' })
        continue
      }

      try {
        let title: string
        let posterUrl: string
        let link: string

        try {
          const igdbData = await this.recordsProvidersService.fetchIGDBFromSteam(appIdStr)
          title = igdbData.title
          posterUrl = igdbData.posterUrl
          link = igdbData.link
        } catch {
          this.logger.warn(`IGDB fallback for Steam app ${game.appId}`)
          const steamGame = await this.getGameDetails(game.appId)
          title = steamGame?.name ?? `Game ${game.appId}`
          posterUrl = steamGame?.header_image ?? ''
          link = `https://store.steampowered.com/app/${game.appId}`
        }

        const record = await this.recordRepository.create({
          title,
          posterUrl,
          link,
          genre: RecordGenre.GAME,
          type: RecordType.WRITTEN,
          status: game.status,
          extra: { steamAppId: appIdStr },
        })

        if (game.grade) {
          await this.recordRepository.update(record.id, { grade: game.grade })
        }

        this.eventEmitter.emit('update-records', {
          genre: record.genre,
          id: record.id,
          action: 'created',
        } satisfies UpdateRecordsPayload)

        created.push(record)
      } catch (error) {
        this.logger.error(`Failed to import Steam app ${game.appId}: ${error}`)
        failed.push({ appId: game.appId, reason: String(error) })
      }
    }

    return { created, failed }
  }

  private async getGameDetails(
    appId: number,
  ): Promise<{ name: string; header_image: string } | null> {
    try {
      const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}`)
      if (!response.ok) return null
      const data = (await response.json()) as any
      const app = data[String(appId)]
      if (!app?.success) return null
      return { name: app.data.name, header_image: app.data.header_image }
    } catch {
      return null
    }
  }
}
