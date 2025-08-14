import { env } from 'node:process'
import { BadRequestException, Injectable } from '@nestjs/common'
import { $Enums } from '@prisma/client'
import { PrismaService } from 'src/database/prisma.service'
import { TwitchService } from '../twitch/twitch.service'

interface PreparedData {
  title: string
  posterUrl: string
  genre: $Enums.RecordGenre
  link: string
}

@Injectable()
export class RecordsProvidersService {
  constructor(private readonly prisma: PrismaService, private readonly twitch: TwitchService) {}

  private readonly linkPatterns: Record<string, { regex: RegExp, parse: (m: RegExpMatchArray) => number | string }> = {
    shikimori: { regex: /shikimori\.one\/animes\/[a-z]?(\d+)/, parse: m => Number(m[1]) },
    kinopoisk: { regex: /kinopoisk\.ru\/(film|series)\/(\d+)/, parse: m => Number(m[2]) },
    igdb: { regex: /igdb\.com\/games\/([^/]+)/, parse: m => m[1] },
    steam: { regex: /store\.steampowered\.com\/app\/(\d+)|steamcommunity\.com\/app\/(\d+)/, parse: m => Number(m[1]) },
  }

  private readonly serviceFetchers: Record<string, (id: any) => Promise<PreparedData>> = {
    shikimori: id => this.fetchShikimori(id),
    kinopoisk: id => this.fetchKinopoisk(id),
    igdb: id => this.fetchIGDB(id),
    steam: id => this.fetchIGDBFromSteam(id),
  }

  async prepareData(data: { link: string, userId: string }): Promise<PreparedData> {
    const { service, id } = this.parseLink(data.link)
    const fetcher = this.serviceFetchers[service]
    if (!fetcher) throw new BadRequestException('Неподдерживаемый сервис')

    const newRecord = await fetcher(id)
    if (!newRecord.title) throw new BadRequestException('Не удалось получить данные из API')

    const foundedRecord = await this.prisma.record.findFirst({
      where: {
        OR: [{ link: newRecord.link }, { title: newRecord.title }],
        genre: newRecord.genre,
      },
    })
    if (foundedRecord && foundedRecord.status !== $Enums.RecordStatus.UNFINISHED) {
      throw new BadRequestException('Уже есть в базе данных')
    }

    data.link = newRecord.link
    return newRecord
  }

  private parseLink(link: string) {
    for (const [service, { regex, parse }] of Object.entries(this.linkPatterns)) {
      const match = link.match(regex)
      if (match) return { service, id: parse(match) }
    }
    throw new BadRequestException('Неверный или неподдерживаемый формат ссылки')
  }

  private async checkGenrePermission(genre: $Enums.RecordGenre, message?: string) {
    const rule = await this.prisma.suggestionRules.findUnique({ where: { genre } })
    if (!rule?.permission) {
      throw new BadRequestException(message ?? `Жанр ${genre} временно не разрешён`)
    }
  }

  private async fetchShikimori(id: number): Promise<PreparedData> {
    await this.checkGenrePermission($Enums.RecordGenre.ANIME, 'Прошу пока аниме не советовать')

    const response = await fetch('https://shikimori.one/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'https://shikimori.one',
      },
      body: JSON.stringify({
        query: `{
          animes(ids: "${id}", limit: 1, kind: "!special") {
            russian
            poster { originalUrl }
          }
        }`,
      }),
    })
    if (!response.ok) throw new BadRequestException(`Не удалось получить данные из API Shikimori: ${response.status}`)

    const anime = (await response.json()).data?.animes?.[0]
    if (!anime) throw new BadRequestException('Аниме не найдено в API Shikimori')

    return {
      title: anime.russian,
      posterUrl: anime.poster.originalUrl ?? '',
      genre: $Enums.RecordGenre.ANIME,
      link: `https://shikimori.one/animes/${id}`,
    }
  }

  private async fetchKinopoisk(id: number): Promise<PreparedData> {
    if (!env.KINOPOISK_API) throw new BadRequestException('API ключ для Кинопоиска не настроен')

    const response = await fetch(`https://kinopoiskapiunofficial.tech/api/v2.2/films/${id}`, {
      headers: {
        'accept': 'application/json',
        'X-API-KEY': env.KINOPOISK_API,
      },
    })
    if (!response.ok) throw new BadRequestException(`Не удалось получить данные из API Кинопоиска: ${response.status}`)

    const result = await response.json()
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

  private async mapKinopoiskGenre(genres: Array<{ genre: string }>, type: string): Promise<$Enums.RecordGenre> {
    if (!genres?.length) throw new BadRequestException('Не удалось определить жанр из API Кинопоиска')

    if (genres.some(g => g.genre.toLowerCase() === 'аниме')) {
      await this.checkGenrePermission($Enums.RecordGenre.ANIME, 'Прошу пока аниме не советовать')
      return $Enums.RecordGenre.ANIME
    }

    if (genres.some(g => g.genre.toLowerCase() === 'мультфильм')) {
      await this.checkGenrePermission($Enums.RecordGenre.CARTOON, 'Прошу пока мультфильмы не советовать')
      return $Enums.RecordGenre.CARTOON
    }

    return this.mapKinopoiskType(type)
  }

  private async mapKinopoiskType(type: string): Promise<$Enums.RecordGenre> {
    const seriesTypes = ['TV_SERIES', 'MINI_SERIES', 'TV_SHOW']
    if (seriesTypes.includes(type)) {
      await this.checkGenrePermission($Enums.RecordGenre.SERIES, 'Прошу пока сериалы не советовать')
      return $Enums.RecordGenre.SERIES
    }
    await this.checkGenrePermission($Enums.RecordGenre.MOVIE, 'Прошу пока фильмы не советовать')
    return $Enums.RecordGenre.MOVIE
  }

  private async fetchIGDBGame(where: string): Promise<PreparedData> {
    await this.checkGenrePermission($Enums.RecordGenre.GAME, 'Прошу пока игры не советовать')

    const accessToken = await this.twitch.getAppAccessToken()
    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Client-ID': env.TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${accessToken}`,
      },
      body: `fields name,cover.url,slug; where ${where};`,
    })
    if (!response.ok) throw new BadRequestException(`Не удалось получить данные из API IGDB: ${response.status}`)

    const game = (await response.json())[0]
    if (!game) throw new BadRequestException('Игра не найдена в API IGDB')

    const coverUrl = game.cover?.url ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : ''
    return {
      title: game.name,
      posterUrl: coverUrl,
      genre: $Enums.RecordGenre.GAME,
      link: `https://www.igdb.com/games/${game.slug}`,
    }
  }

  private fetchIGDB(id: string) {
    return this.fetchIGDBGame(`slug = "${id}"`)
  }

  private async fetchIGDBFromSteam(appId: number) {
    const accessToken = await this.twitch.getAppAccessToken()
    const externalResp = await fetch('https://api.igdb.com/v4/external_games', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Client-ID': env.TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${accessToken}`,
      },
      body: `fields game; where uid = "${appId}" & category = 1;`,
    })
    if (!externalResp.ok) throw new BadRequestException(`Не удалось получить данные external_games IGDB: ${externalResp.status}`)

    const externalData = await externalResp.json()
    if (!externalData[0]?.game) throw new BadRequestException('Игра не найдена в IGDB по Steam ID')

    return this.fetchIGDBGame(`id = ${externalData[0].game}`)
  }
}
