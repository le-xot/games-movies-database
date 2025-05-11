import { env } from 'node:process'
import { BadRequestException, Injectable } from '@nestjs/common'
import { $Enums, Limit } from '@prisma/client'
import { PrismaService } from 'src/database/prisma.service'
import { RecordUpsertDTO } from '../record/record.dto'
import { TwitchService } from '../twitch/twitch.service'
import { UserSuggestionDTO } from './suggesttion.dto'

@Injectable()
export class SuggestionService {
  constructor(
    private prisma: PrismaService,
    private twitch: TwitchService,
  ) {}

  async getSuggestions() {
    const suggestions = await this.prisma.record.findMany({
      where: { type: $Enums.RecordType.SUGGESTION },
      include: { user: true },
    })
    return suggestions
  }

  async userSuggest(data: UserSuggestionDTO, userId: string): Promise<UserSuggestionDTO> {
    const { service, id } = this.parseLink(data.link)

    let newRecord: RecordUpsertDTO

    const limit = await this.prisma.limit.findUnique({
      where: { name: $Enums.LimitType.SUGGESTION },
    })

    const suggestionsCount = await this.prisma.record.count({ where: { userId, type: $Enums.LimitType.SUGGESTION } })

    if (suggestionsCount >= limit.quantity) {
      throw new BadRequestException('Достигнут лимит предложений')
    }

    switch (service) {
      case 'shikimori':
        newRecord = await this.fetchShikimori(id as number, userId, data.link)
        break
      case 'kinopoisk':
        newRecord = await this.fetchKinopoisk(id as number, userId, data.link)
        break
      case 'igdb':
        newRecord = await this.fetchIGDB(id as string, userId, data.link)
        break
      default:
        throw new BadRequestException('Неподдерживаемый сервис')
    }

    if (!newRecord.title) {
      throw new BadRequestException('Не удалось получить данные из API')
    }

    const foundedRecord = await this.prisma.record.findFirst({
      where: {
        title: newRecord.title,
        genre: newRecord.genre,
      },
    })

    if (foundedRecord && foundedRecord.status !== $Enums.RecordStatus.UNFINISHED) {
      throw new BadRequestException('Уже есть в базе данных')
    }

    return this.prisma.record.create({ data: newRecord })
  }

  changeSuggestionLimit(limit: number): Promise<Limit> {
    return this.prisma.limit.update({
      where: { name: 'SUGGESTION' },
      data: { quantity: limit },
    })
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

  private async fetchShikimori(id: number, userId: string, link: string): Promise<RecordUpsertDTO> {
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

      const data: RecordUpsertDTO = {
        title: anime.russian,
        link,
        posterUrl: anime.poster.originalUrl,
        status: $Enums.RecordStatus.QUEUE,
        type: $Enums.RecordType.SUGGESTION,
        genre: $Enums.RecordGenre.ANIME,
        userId,
      }
      return data
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      throw new BadRequestException(`Не удалось получить данные из API Shikimori: ${error.message || 'неизвестная ошибка'}`)
    }
  }

  private async fetchKinopoisk(id: number, userId: string, link: string): Promise<RecordUpsertDTO> {
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
      const genre = this.mapKinopoiskGenre(result.genres, result.type)

      const data: RecordUpsertDTO = {
        title: result.nameRu || result.nameEn || result.nameOriginal,
        link,
        posterUrl: result.posterUrl,
        status: $Enums.RecordStatus.QUEUE,
        type: $Enums.RecordType.SUGGESTION,
        genre,
        userId,
      }
      return data
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      throw new BadRequestException(`Не удалось получить данные из API Кинопоиска: ${error.message || 'неизвестная ошибка'}`)
    }
  }

  private mapKinopoiskGenre(genres: Array<{ genre: string }>, type: string): $Enums.RecordGenre {
    if (!genres || genres.length === 0) {
      throw new BadRequestException('Не удалось определить жанр из API Кинопоиска')
    }

    const hasAnime = genres.some(({ genre }) => genre.toLowerCase() === 'аниме')
    const hasCartoon = genres.some(({ genre }) => genre.toLowerCase() === 'мультфильм')

    if (hasAnime) {
      return $Enums.RecordGenre.ANIME
    }

    if (hasCartoon) {
      return $Enums.RecordGenre.CARTOON
    }

    return this.mapKinopoiskType(type)
  }

  private mapKinopoiskType(type: string): $Enums.RecordGenre {
    const seriesTypes = ['TV_SERIES', 'MINI_SERIES', 'TV_SHOW']

    if (seriesTypes.includes(type)) {
      return $Enums.RecordGenre.SERIES
    }

    return $Enums.RecordGenre.MOVIE
  }

  private async fetchIGDB(id: string, userId: string, link: string): Promise<RecordUpsertDTO> {
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
        link,
        posterUrl: coverUrl,
        status: $Enums.RecordStatus.QUEUE,
        type: $Enums.RecordType.SUGGESTION,
        genre: $Enums.RecordGenre.GAME,
        userId,
      }
      return data
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      throw new BadRequestException(`Не удалось получить данные из API IGDB: ${error.message || 'неизвестная ошибка'}`)
    }
  }
}
