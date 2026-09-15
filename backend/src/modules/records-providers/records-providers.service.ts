import { env } from 'node:process'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { RecordGenre, RecordStatus, RecordType } from '@/enums'
import { TwitchService } from '@/modules/twitch/twitch.service'
import { DrizzleRecordsProvidersRepository } from './repositories/drizzle-records-providers.repository'
import type { RecordDomain } from '@/modules/record/entities/record-domain.entity'

interface PreparedData {
  title: string
  posterUrl: string
  genre: RecordGenre
  link: string
}

interface KinopoiskFilm {
  kinopoiskId?: number
  nameRu?: string
  nameEn?: string
  nameOriginal?: string
  posterUrl?: string
  type: string
  genres: Array<{ genre: string }>
}

const KINOPOISK_SERIES_TYPES = ['TV_SERIES', 'MINI_SERIES', 'TV_SHOW']

const GENRE_PERMISSION_MESSAGES: Record<RecordGenre, string> = {
  [RecordGenre.ANIME]: 'Прошу пока аниме не советовать',
  [RecordGenre.CARTOON]: 'Прошу пока мультфильмы не советовать',
  [RecordGenre.SERIES]: 'Прошу пока сериалы не советовать',
  [RecordGenre.MOVIE]: 'Прошу пока фильмы не советовать',
  [RecordGenre.GAME]: 'Прошу пока игры не советовать',
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
          pattern: /^\/(film|series)\/(\d+)\/?$/,
          fetch: (match) => this.fetchKinopoisk(Number(match[2])),
        },
      ],
    },
    {
      hosts: ['imdb.com'],
      routes: [
        {
          pattern: /^\/title\/(tt\d+)\/?$/,
          fetch: (match) => this.fetchFromImdb(match[1]),
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
    private readonly repo: DrizzleRecordsProvidersRepository,
    private readonly twitch: TwitchService,
  ) {}

  private readonly writtenStatusMessages: Record<RecordStatus, string> = {
    [RecordStatus.DONE]: 'Уже есть в базе со статусом "Готово"',
    [RecordStatus.DROP]: 'Уже есть в базе со статусом "Дроп"',
    [RecordStatus.NOTINTERESTED]: 'Уже есть в базе со статусом "Не интересно"',
    [RecordStatus.PROGRESS]: 'Уже есть в базе со статусом "В процессе"',
    [RecordStatus.QUEUE]: 'Уже есть в очереди',
    [RecordStatus.UNFINISHED]: 'Уже есть в базе со статусом "Нет концовки"',
  }

  private validateExistingRecord(record: RecordDomain) {
    if (record.type === RecordType.SUGGESTION) {
      throw new BadRequestException('Уже есть в советах')
    }
    if (record.type !== RecordType.WRITTEN) return

    throw new BadRequestException(
      record.status == null ? 'Уже есть в базе' : this.writtenStatusMessages[record.status],
    )
  }

  async prepareData(data: { link: string }): Promise<PreparedData> {
    const newRecord = await this.resolveLink(data.link)
    if (!newRecord.title) throw new BadRequestException('Не удалось получить данные из API')

    const foundedRecord = await this.repo.findRecordByLinkAndGenre(newRecord.link, newRecord.genre)

    if (foundedRecord) {
      this.logger.warn(`Found existing record for link=${data.link}`)
      this.validateExistingRecord(foundedRecord)
    }

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

  private async checkGenrePermission(genre: RecordGenre) {
    const rule = await this.repo.findSuggestionRulesByGenre(genre)
    if (!rule?.permission) {
      throw new BadRequestException(GENRE_PERMISSION_MESSAGES[genre])
    }
  }

  private async fetchShikimori(id: number): Promise<PreparedData> {
    await this.checkGenrePermission(RecordGenre.ANIME)

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
      posterUrl: anime.image?.original ? `https://shikimori.one${anime.image.original}` : '',
      genre: RecordGenre.ANIME,
      link: `https://shikimori.one/animes/${id}`,
    }
  }

  private async fetchKinopoisk(id: number): Promise<PreparedData> {
    const film = await this.kinopoiskGet<KinopoiskFilm>(`films/${id}`)
    return this.mapKinopoiskFilm(film, id)
  }

  private async fetchFromImdb(imdbId: string): Promise<PreparedData> {
    const data = await this.kinopoiskGet<{ items?: KinopoiskFilm[] }>(`films?imdbId=${imdbId}`)
    const film = data.items?.[0]
    if (!film) throw new BadRequestException('Фильм не найден в API Кинопоиска по IMDB ID')

    return this.mapKinopoiskFilm(film)
  }

  private async kinopoiskGet<T>(path: string): Promise<T> {
    if (!env.KINOPOISK_API) throw new BadRequestException('API ключ для Кинопоиска не настроен')

    const response = await fetch(`https://kinopoiskapiunofficial.tech/api/v2.2/${path}`, {
      headers: {
        accept: 'application/json',
        'X-API-KEY': env.KINOPOISK_API,
      },
    })
    if (!response.ok)
      throw new BadRequestException(
        `Не удалось получить данные из API Кинопоиска: ${response.status}`,
      )

    return (await response.json()) as T
  }

  private async mapKinopoiskFilm(film: KinopoiskFilm, fallbackId?: number): Promise<PreparedData> {
    const genre = await this.mapKinopoiskGenre(film.genres, film.type)
    const path = KINOPOISK_SERIES_TYPES.includes(film.type) ? 'series' : 'film'

    return {
      title: film.nameRu || film.nameEn || film.nameOriginal,
      posterUrl: film.posterUrl ?? '',
      genre,
      link: `https://www.kinopoisk.ru/${path}/${film.kinopoiskId ?? fallbackId}`,
    }
  }

  private async mapKinopoiskGenre(
    genres: Array<{ genre: string }>,
    type: string,
  ): Promise<RecordGenre> {
    if (!genres?.length)
      throw new BadRequestException('Не удалось определить жанр из API Кинопоиска')

    if (genres.some((g) => g.genre.toLowerCase() === 'аниме')) {
      await this.checkGenrePermission(RecordGenre.ANIME)
      return RecordGenre.ANIME
    }

    if (genres.some((g) => g.genre.toLowerCase() === 'мультфильм')) {
      await this.checkGenrePermission(RecordGenre.CARTOON)
      return RecordGenre.CARTOON
    }

    return this.mapKinopoiskType(type)
  }

  private async mapKinopoiskType(type: string): Promise<RecordGenre> {
    if (KINOPOISK_SERIES_TYPES.includes(type)) {
      await this.checkGenrePermission(RecordGenre.SERIES)
      return RecordGenre.SERIES
    }
    await this.checkGenrePermission(RecordGenre.MOVIE)
    return RecordGenre.MOVIE
  }

  private async fetchIGDBGame(where: string): Promise<PreparedData> {
    await this.checkGenrePermission(RecordGenre.GAME)

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

  async fetchIGDBFromSteam(appId: string) {
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
}
