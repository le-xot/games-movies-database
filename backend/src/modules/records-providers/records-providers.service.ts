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

  async prepareData(data: { link: string, userId: string }): Promise<PreparedData> {
    const { service, id } = this.parseLink(data.link)

    let newRecord: PreparedData

    switch (service) {
      case 'shikimori':
        newRecord = await this.fetchShikimori(id as number)
        break
      case 'kinopoisk':
        newRecord = await this.fetchKinopoisk(id as number)
        break
      case 'igdb':
        newRecord = await this.fetchIGDB(id as string)
        break
      case 'steam':
        newRecord = await this.fetchIGDBFromSteam(id as number)
        break
      default:
        throw new BadRequestException('Неподдерживаемый сервис')
    }

    if (!newRecord.title) {
      throw new BadRequestException('Не удалось получить данные из API')
    }

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

  private parseLink(link: string): { service: string, id: number | string } {
    const patterns = {
      shikimori: /shikimori\.one\/animes\/[a-z]?(\d+)/,
      kinopoisk: /kinopoisk\.ru\/(film|series)\/(\d+)/,
      igdb: /igdb\.com\/games\/([^/]+)/,
      steam: /store\.steampowered\.com\/app\/(\d+)/,
    }
    for (const [service, pattern] of Object.entries(patterns)) {
      const match = link.match(pattern)
      if (match) {
        if (service === 'kinopoisk') return { service, id: Number(match[2]) }
        if (service === 'igdb') return { service, id: match[1] }
        if (service === 'steam') return { service, id: Number(match[1]) }
        return { service, id: Number(match[1]) }
      }
    }
    throw new BadRequestException('Неверный или неподдерживаемый формат ссылки')
  }

  private async fetchShikimori(id: number): Promise<PreparedData> {
    const isAnimeAllow = await this.prisma.suggestionRules.findUnique({ where: { genre: $Enums.RecordGenre.ANIME } })
    if (!isAnimeAllow?.permission) throw new BadRequestException('Прошу пока аниме не советовать')

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

    const result = await response.json()
    const anime = result.data?.animes?.[0]
    if (!anime) throw new BadRequestException('Аниме не найдено в API Shikимори')

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

    const seriesTypes = ['TV_SERIES', 'MINI_SERIES', 'TV_SHOW']
    const path = seriesTypes.includes(result.type) ? 'series' : 'film'

    return {
      title: result.nameRu || result.nameEn || result.nameOriginal,
      posterUrl: result.posterUrl ?? '',
      genre: await this.mapKinopoiskGenre(result.genres, result.type),
      link: `https://www.kinopoisk.ru/${path}/${id}`,
    }
  }

  private async mapKinopoiskGenre(genres: Array<{ genre: string }>, type: string): Promise<$Enums.RecordGenre> {
    if (!genres?.length) throw new BadRequestException('Не удалось определить жанр из API Кинопоиска')

    const hasAnime = genres.some(({ genre }) => genre.toLowerCase() === 'аниме')
    const hasCartoon = genres.some(({ genre }) => genre.toLowerCase() === 'мультфильм')

    if (hasAnime) {
      const isAnimeAllow = await this.prisma.suggestionRules.findUnique({ where: { genre: $Enums.RecordGenre.ANIME } })
      if (!isAnimeAllow?.permission) throw new BadRequestException('Прошу пока аниме не советовать')
      return $Enums.RecordGenre.ANIME
    }

    if (hasCartoon) {
      const isCartoonAllow = await this.prisma.suggestionRules.findUnique({ where: { genre: $Enums.RecordGenre.CARTOON } })
      if (!isCartoonAllow?.permission) throw new BadRequestException('Прошу пока мультфильмы не советовать')
      return $Enums.RecordGenre.CARTOON
    }

    return this.mapKinopoiskType(type)
  }

  private async mapKinopoiskType(type: string): Promise<$Enums.RecordGenre> {
    const seriesTypes = ['TV_SERIES', 'MINI_SERIES', 'TV_SHOW']

    if (seriesTypes.includes(type)) {
      const isSeriesAllow = await this.prisma.suggestionRules.findUnique({ where: { genre: $Enums.RecordGenre.SERIES } })
      if (!isSeriesAllow?.permission) throw new BadRequestException('Прошу пока сериалы не советовать')
      return $Enums.RecordGenre.SERIES
    }

    const isMovieAllow = await this.prisma.suggestionRules.findUnique({ where: { genre: $Enums.RecordGenre.MOVIE } })
    if (!isMovieAllow?.permission) throw new BadRequestException('Прошу пока фильмы не советовать')
    return $Enums.RecordGenre.MOVIE
  }

  private async fetchIGDB(id: string): Promise<PreparedData> {
    const isGameAllow = await this.prisma.suggestionRules.findUnique({ where: { genre: $Enums.RecordGenre.GAME } })
    if (!isGameAllow?.permission) throw new BadRequestException('Прошу пока игры не советовать')

    const accessToken = await this.twitch.getAppAccessToken()
    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Client-ID': env.TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${accessToken}`,
      },
      body: `fields name,cover.url,slug; where slug = "${id}";`,
    })
    if (!response.ok) throw new BadRequestException(`Не удалось получить данные из API IGDB: ${response.status}`)

    const result = await response.json()
    const game = result[0]
    if (!game) throw new BadRequestException('Игра не найдена в API IGDB')

    const coverUrl = game.cover?.url ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : ''

    return {
      title: game.name,
      posterUrl: coverUrl,
      genre: $Enums.RecordGenre.GAME,
      link: `https://www.igdb.com/games/${game.slug}`,
    }
  }

  private async fetchIGDBFromSteam(appId: number): Promise<PreparedData> {
    const isGameAllow = await this.prisma.suggestionRules.findUnique({ where: { genre: $Enums.RecordGenre.GAME } })
    if (!isGameAllow?.permission) throw new BadRequestException('Прошу пока игры не советовать')

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

    const gameId = externalData[0].game

    const gameResp = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Client-ID': env.TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${accessToken}`,
      },
      body: `fields name,cover.url,slug; where id = ${gameId};`,
    })
    if (!gameResp.ok) throw new BadRequestException(`Не удалось получить данные из API IGDB: ${gameResp.status}`)

    const gameData = await gameResp.json()
    const game = gameData[0]
    if (!game) throw new BadRequestException('Игра не найдена в API IGDB')

    const coverUrl = game.cover?.url ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : ''

    return {
      title: game.name,
      posterUrl: coverUrl,
      genre: $Enums.RecordGenre.GAME,
      link: `https://www.igdb.com/games/${game.slug}`,
    }
  }
}
