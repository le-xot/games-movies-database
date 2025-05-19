import { env } from 'node:process'
import { BadRequestException, Injectable } from '@nestjs/common'
import { $Enums } from '@prisma/client'
import { PrismaService } from 'src/database/prisma.service'
import { TwitchService } from '../twitch/twitch.service'

interface PreparedData {
  title: string
  posterUrl: string
  genre: $Enums.RecordGenre
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
      default:
        throw new BadRequestException('Неподдерживаемый сервис')
    }

    if (!newRecord.title) {
      throw new BadRequestException('Не удалось получить данные из API')
    }

    const foundedRecord = await this.prisma.record.findFirst({
      where: {
        OR: [
          { link: data.link },
          { title: newRecord.title },
        ],
        genre: newRecord.genre,
      },
    })

    if (foundedRecord && foundedRecord.status !== $Enums.RecordStatus.UNFINISHED) {
      throw new BadRequestException('Уже есть в базе данных')
    }

    return newRecord
  }

  private parseLink(link: string): { service: string, id: number | string } {
    const patterns = {
      shikimori: /shikimori\.one\/animes\/[a-z]?(\d+)/,
      kinopoisk: /kinopoisk\.ru\/(film|series)\/(\d+)/,
      igdb: /igdb\.com\/games\/([^/]+)/,
    }
    for (const [service, pattern] of Object.entries(patterns)) {
      const match = link.match(pattern)
      if (match) {
        if (service === 'kinopoisk') {
          return { service, id: Number(match[2]) }
        } else if (service === 'igdb') {
          return { service, id: match[1] }
        } else {
          return { service, id: Number(match[1]) }
        }
      }
    }
    throw new BadRequestException('Неверный или неподдерживаемый формат ссылки')
  }

  private async fetchShikimori(id: number): Promise<PreparedData> {
    const isAnimeAllow = await this.prisma.suggestionRules.findUnique({
      where: { genre: $Enums.RecordGenre.ANIME },
    })
    if (!isAnimeAllow.permission) {
      throw new BadRequestException('Прошу пока аниме не советовать')
    }

    try {
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
              score
            }
          }`,
        }),
      })

      if (!response.ok) {
        throw new BadRequestException(`Не удалось получить данные из API Shikimori: ${response.status}`)
      }

      const result = await response.json()

      if (!result.data?.animes?.[0]) {
        throw new BadRequestException('Аниме не найдено в API Shikimori')
      }

      const anime = result.data.animes[0]

      const data = {
        title: anime.russian,
        posterUrl: anime.poster.originalUrl,
        genre: $Enums.RecordGenre.ANIME,
      }
      return data
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      throw new BadRequestException(`Не удалось получить данные из API Shikimori: ${error.message || 'неизвестная ошибка'}`)
    }
  }

  private async fetchKinopoisk(id: number): Promise<PreparedData> {
    if (!env.KINOPOISK_API) {
      throw new BadRequestException('API ключ для Кинопоиска не настроен')
    }

    try {
      const response = await fetch(
        `https://kinopoiskapiunofficial.tech/api/v2.2/films/${id}`,
        {
          headers: {
            'accept': 'application/json',
            'X-API-KEY': env.KINOPOISK_API,
          },
        },
      )

      if (!response.ok) {
        throw new BadRequestException(`Не удалось получить данные из API Кинопоиска: ${response.status}`)
      }

      const result = await response.json()
      const data = {
        title: result.nameRu || result.nameEn || result.nameOriginal,
        posterUrl: result.posterUrl,
        genre: await this.mapKinopoiskGenre(result.genres, result.type),
      }
      return data
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      throw new BadRequestException(`Не удалось получить данные из API Кинопоиска: ${error.message || 'неизвестная ошибка'}`)
    }
  }

  private async mapKinopoiskGenre(genres: Array<{ genre: string }>, type: string): Promise<$Enums.RecordGenre> {
    if (!genres || genres.length === 0) {
      throw new BadRequestException('Не удалось определить жанр из API Кинопоиска')
    }

    const hasAnime = genres.some(({ genre }) => genre.toLowerCase() === 'аниме')
    const hasCartoon = genres.some(({ genre }) => genre.toLowerCase() === 'мультфильм')

    if (hasAnime) {
      const isAnimeAllow = await this.prisma.suggestionRules.findUnique({
        where: { genre: $Enums.RecordGenre.ANIME },
      })
      if (!isAnimeAllow.permission) {
        throw new BadRequestException('Прошу пока аниме не советовать')
      }
      return $Enums.RecordGenre.ANIME
    }

    if (hasCartoon) {
      const isCartoonAllow = await this.prisma.suggestionRules.findUnique({
        where: { genre: $Enums.RecordGenre.CARTOON },
      })
      if (!isCartoonAllow.permission) {
        throw new BadRequestException('Прошу пока мультфильмы не советовать')
      }
      return $Enums.RecordGenre.CARTOON
    }

    return this.mapKinopoiskType(type)
  }

  private async mapKinopoiskType(type: string): Promise<$Enums.RecordGenre> {
    const seriesTypes = ['TV_SERIES', 'MINI_SERIES', 'TV_SHOW']

    if (seriesTypes.includes(type)) {
      const isSeriesAllow = await this.prisma.suggestionRules.findUnique({
        where: { genre: $Enums.RecordGenre.SERIES },
      })
      if (!isSeriesAllow.permission) {
        throw new BadRequestException('Прошу пока сериалы не советовать')
      }
      return $Enums.RecordGenre.SERIES
    }

    const isMovieAllow = await this.prisma.suggestionRules.findUnique({
      where: { genre: $Enums.RecordGenre.MOVIE },
    })
    if (!isMovieAllow.permission) {
      throw new BadRequestException('Прошу пока фильмы не советовать')
    }
    return $Enums.RecordGenre.MOVIE
  }

  private async fetchIGDB(id: string): Promise<PreparedData> {
    const isGameAllow = await this.prisma.suggestionRules.findUnique({
      where: { genre: $Enums.RecordGenre.GAME },
    })
    if (!isGameAllow.permission) {
      throw new BadRequestException('Прошу пока игры не советовать')
    }

    try {
      const accessToken = await this.twitch.getAppAccessToken()

      const response = await fetch(
        'https://api.igdb.com/v4/games',
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Client-ID': env.TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${accessToken}`,
          },
          body: `fields name,rating,cover.url; where slug = "${id}";`,
        },
      )

      if (!response.ok) {
        throw new BadRequestException(`Не удалось получить данные из API IGDB: ${response.status}`)
      }

      const result = await response.json()

      if (!result[0]) {
        throw new BadRequestException('Игра не найдена в API IGDB')
      }

      const game = result[0]
      const coverUrl = game.cover?.url ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : null

      const data = {

        title: game.name,
        posterUrl: coverUrl,
        genre: $Enums.RecordGenre.GAME,

      }
      return data
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      throw new BadRequestException(`Не удалось получить данные из API IGDB: ${error.message || 'неизвестная ошибка'}`)
    }
  }
}
