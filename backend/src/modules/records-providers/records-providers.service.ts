import { env } from 'node:process'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { RecordGenre, RecordStatus, RecordType } from '@/enums'
import { TwitchService } from '@/modules/twitch/twitch.service'
import { RecordsProvidersRepository } from './repositories/records-providers.repository'

interface PreparedData {
  title: string
  posterUrl: string
  genre: RecordGenre
  link: string
}

interface LinkRoute {
  pattern: RegExp
  fetch: (match: RegExpMatchArray) => Promise<PreparedData>
}

interface LinkProvider {
  hosts: string[]
  routes: LinkRoute[]
}

@Injectable()
export class RecordsProvidersService {
  private readonly logger = new Logger(RecordsProvidersService.name)
  private readonly linkProviders: LinkProvider[] = [
    {
      hosts: ['shikimori.one', 'shikimori.io'],
      routes: [
        {
          pattern: /^\/animes\/[a-z]?(\d+)(?:-[a-z0-9-]*)?$/i,
          fetch: (match) => this.fetchShikimori(Number(match[1])),
        },
      ],
    },
    {
      hosts: ['kinopoisk.ru'],
      routes: [
        {
          pattern: /^\/(film|series)\/(\d+)$/,
          fetch: (match) => this.fetchKinopoisk(Number(match[2])),
        },
      ],
    },
    {
      hosts: ['igdb.com'],
      routes: [
        {
          pattern: /^\/games\/([^/]+)$/,
          fetch: (match) => this.fetchIGDB(match[1]),
        },
      ],
    },
    {
      hosts: ['store.steampowered.com', 'steamcommunity.com'],
      routes: [
        {
          pattern: /^\/app\/(\d+)$/,
          fetch: (match) => this.fetchIGDBFromSteam(match[1]),
        },
      ],
    },
    {
      hosts: ['on.kinohub.vip', 'tv.kinohub.vip', 'kinobox.in'],
      routes: [
        {
          pattern: /^\/movie\/(\d+)$/i,
          fetch: (match) => this.fetchKinopoisk(Number(match[1])),
        },
        {
          pattern: /^\/(shikimori|shikimor)\/(\d+)$/i,
          fetch: (match) => this.fetchShikimori(Number(match[2])),
        },
      ],
    },
  ]

  constructor(
    private readonly repo: RecordsProvidersRepository,
    private readonly twitch: TwitchService,
  ) {}

  private readonly recordValidationRules = [
    { condition: (r: any) => r.type === RecordType.AUCTION, message: 'Уже есть в аукционе' },
    {
      condition: (r: any) => r.type === RecordType.SUGGESTION,
      message: 'Уже есть в советах',
    },
    {
      condition: (r: any) => r.type === RecordType.WRITTEN && r.status === RecordStatus.DONE,
      message: 'Уже есть в базе со статусом "Готово"',
    },
    {
      condition: (r: any) => r.type === RecordType.WRITTEN && r.status === RecordStatus.DROP,
      message: 'Уже есть в базе со статусом "Дроп"',
    },
    {
      condition: (r: any) =>
        r.type === RecordType.WRITTEN && r.status === RecordStatus.NOTINTERESTED,
      message: 'Уже есть в базе со статусом "Не интересно"',
    },
    {
      condition: (r: any) => r.type === RecordType.WRITTEN && r.status === RecordStatus.PROGRESS,
      message: 'Уже есть в базе со статусом "В процессе"',
    },
    {
      condition: (r: any) => r.type === RecordType.WRITTEN && r.status === RecordStatus.QUEUE,
      message: 'Уже есть в очереди',
    },
    {
      condition: (r: any) => r.type === RecordType.WRITTEN && r.status === RecordStatus.UNFINISHED,
      message: 'Уже есть в базе со статусом "Нет концовки"',
    },
    {
      condition: (r: any) => r.type === RecordType.WRITTEN && r.status === null,
      message: 'Уже есть в базе',
    },
  ]

  private validateExistingRecord(record: any) {
    for (const rule of this.recordValidationRules) {
      if (rule.condition(record)) {
        throw new BadRequestException(rule.message)
      }
    }
  }

  async prepareData(data: { link: string }): Promise<PreparedData> {
    const newRecord = await this.resolveLink(data.link)
    if (!newRecord.title) throw new BadRequestException('Не удалось получить данные из API')

    const foundedRecord = await this.repo.findRecordByLinkAndGenre(newRecord.link, newRecord.genre)

    if (foundedRecord) {
      this.logger.warn(`Found existing record for link=${data.link}`)
      this.validateExistingRecord(foundedRecord)
    }

    data.link = newRecord.link
    return newRecord
  }

  private resolveLink(link: string): Promise<PreparedData> {
    const url = this.parseUrl(link)
    const normalizedHost = this.normalizeHost(url.hostname)

    for (const provider of this.linkProviders) {
      if (!provider.hosts.includes(normalizedHost)) continue

      for (const route of provider.routes) {
        const match = url.pathname.match(route.pattern)
        if (match) return route.fetch(match)
      }
    }
    throw new BadRequestException('Неверный или неподдерживаемый формат ссылки')
  }

  private parseUrl(link: string) {
    try {
      return new URL(link)
    } catch {
      throw new BadRequestException('Неверный или неподдерживаемый формат ссылки')
    }
  }

  private normalizeHost(hostname: string) {
    return hostname.replace(/^www\./i, '')
  }

  private async checkGenrePermission(genre: RecordGenre, message?: string) {
    const rule = await this.repo.findSuggestionRulesByGenre(genre)
    if (!rule?.permission) {
      throw new BadRequestException(message ?? `Жанр ${genre} временно не разрешён`)
    }
  }

  private async fetchShikimori(id: number): Promise<PreparedData> {
    await this.checkGenrePermission(RecordGenre.ANIME, 'Прошу пока аниме не советовать')

    const response = await fetch(`https://shikimori.one/api/animes/${id}`, {
      headers: { Accept: 'application/json' },
    })
    if (!response.ok)
      throw new BadRequestException(
        `Не удалось получить данные из API Shikimori: ${response.status}`,
      )

    const anime = (await response.json()) as any
    if (!anime) throw new BadRequestException('Аниме не найдено в API Shikimori')

    return {
      title: anime.russian || anime.name,
      posterUrl: anime.image?.original ?? '',
      genre: RecordGenre.ANIME,
      link: `https://shikimori.one/animes/${id}`,
    }
  }

  private async fetchKinopoisk(id: number): Promise<PreparedData> {
    if (!env.KINOPOISK_API) throw new BadRequestException('API ключ для Кинопоиска не настроен')

    const response = await fetch(`https://kinopoiskapiunofficial.tech/api/v2.2/films/${id}`, {
      headers: {
        accept: 'application/json',
        'X-API-KEY': env.KINOPOISK_API,
      },
    })
    if (!response.ok)
      throw new BadRequestException(
        `Не удалось получить данные из API Кинопоиска: ${response.status}`,
      )

    const result = (await response.json()) as any
    const genre = await this.mapKinopoiskGenre(result.genres, result.type)
    const seriesTypes = ['TV_SERIES', 'MINI_SERIES', 'TV_SHOW']
    const path = seriesTypes.includes(result.type) ? 'series' : 'film'

    return {
      title: result.nameRu || result.nameEn || result.nameOriginal,
      posterUrl: result.posterUrl ?? '',
      genre,
      link: `https://www.kinopoisk.ru/${path}/${id}`,
    }
  }

  private async mapKinopoiskGenre(
    genres: Array<{ genre: string }>,
    type: string,
  ): Promise<RecordGenre> {
    if (!genres?.length)
      throw new BadRequestException('Не удалось определить жанр из API Кинопоиска')

    if (genres.some((g) => g.genre.toLowerCase() === 'аниме')) {
      await this.checkGenrePermission(RecordGenre.ANIME, 'Прошу пока аниме не советовать')
      return RecordGenre.ANIME
    }

    if (genres.some((g) => g.genre.toLowerCase() === 'мультфильм')) {
      await this.checkGenrePermission(RecordGenre.CARTOON, 'Прошу пока мультфильмы не советовать')
      return RecordGenre.CARTOON
    }

    return this.mapKinopoiskType(type)
  }

  private async mapKinopoiskType(type: string): Promise<RecordGenre> {
    const seriesTypes = ['TV_SERIES', 'MINI_SERIES', 'TV_SHOW']
    if (seriesTypes.includes(type)) {
      await this.checkGenrePermission(RecordGenre.SERIES, 'Прошу пока сериалы не советовать')
      return RecordGenre.SERIES
    }
    await this.checkGenrePermission(RecordGenre.MOVIE, 'Прошу пока фильмы не советовать')
    return RecordGenre.MOVIE
  }

  private async fetchIGDBGame(where: string): Promise<PreparedData> {
    await this.checkGenrePermission(RecordGenre.GAME, 'Прошу пока игры не советовать')

    const accessToken = await this.twitch.getAppAccessToken()
    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Client-ID': env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
      },
      body: `fields name,cover.url,slug; where ${where};`,
    })
    if (!response.ok)
      throw new BadRequestException(`Не удалось получить данные из API IGDB: ${response.status}`)

    const game = (await response.json())[0]
    if (!game) throw new BadRequestException('Игра не найдена в API IGDB')

    const coverUrl = game.cover?.url
      ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}`
      : ''
    return {
      title: game.name,
      posterUrl: coverUrl,
      genre: RecordGenre.GAME,
      link: `https://www.igdb.com/games/${game.slug}`,
    }
  }

  private fetchIGDB(id: string) {
    return this.fetchIGDBGame(`slug = "${id}"`)
  }

  private async fetchIGDBFromSteam(appId: string) {
    const accessToken = await this.twitch.getAppAccessToken()

    const body = `fields game; where uid = "${appId}" & external_game_source = 1; limit 1;`

    const externalResp = await fetch('https://api.igdb.com/v4/external_games', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Client-ID': env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'text/plain; charset=UTF-8',
      },
      body,
    })
    if (!externalResp.ok)
      throw new BadRequestException(
        `Не удалось получить данные external_games IGDB: ${externalResp.status}`,
      )

    const externalData = await externalResp.json()
    if (!externalData[0]?.game) throw new BadRequestException('Игра не найдена в IGDB по Steam ID')

    return this.fetchIGDBGame(`id = ${externalData[0].game}`)
  }

  private async fetchReyohoho(id: number): Promise<PreparedData> {
    return await this.fetchKinopoisk(id)
  }
}
