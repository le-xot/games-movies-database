import { env } from 'node:process'
import { BadRequestException, Injectable } from '@nestjs/common'
import { $Enums, Limit, Suggestion } from '@prisma/client'
import { PrismaService } from 'src/database/prisma.service'
import { SuggestionsDto, UserSuggestionDTO } from './suggesttion.dto'

@Injectable()
export class SuggestionService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async getSuggestions(): Promise<SuggestionsDto> {
    const suggestions = await this.prisma.suggestion.findMany({
      include: { user: true },
    })

    return {
      suggestions: suggestions.map((s) => ({
        id: s.id,
        title: s.title,
        link: s.link,
        genre: s.genre,
        posterUrl: s.posterUrl,
        grade: s.grade,
        user: s.user,
      })),
    }
  }

  async deleteSuggestion(id: number): Promise<void> {
    await this.prisma.suggestion.delete({ where: { id } })
  }

  async userSuggest(suggest: UserSuggestionDTO, userId: string): Promise<Suggestion> {
    const { service, id } = this.parseLink(suggest.link)
    let data: CreateSuggestion

    const limit = await this.prisma.limit.findUnique({
      where: { name: $Enums.LimitType.SUGGESTION },
    })

    if (!limit) {
      throw new BadRequestException('Лимит предложений не настроен')
    }

    const suggestionsCount = await this.prisma.suggestion.count({ where: { userId } })
    if (suggestionsCount >= limit.quantity) {
      throw new BadRequestException('Достигнут лимит предложений')
    }

    switch (service) {
      case 'shikimori':
        data = await this.fetchShikimori(id as number)
        break
      case 'kinopoisk':
        data = await this.fetchKinopoisk(id as number)
        break
      case 'igdb':
        data = await this.fetchIGDB(id as string)
        break
      default:
        throw new BadRequestException('Неподдерживаемый сервис')
    }

    if (!data.title) {
      throw new BadRequestException('Не удалось получить данные из API')
    }

    if (data.type === 'WATCH') {
      const [foundedInDbMovie, foundedInSuggestion] = await Promise.all([
        this.prisma.video.findFirst({
          where: { title: data.title },
        }),
        this.prisma.suggestion.findFirst({
          where: { title: data.title },
        }),
      ])

      if (foundedInSuggestion || (foundedInDbMovie && foundedInDbMovie.status !== $Enums.PrismaStatuses.UNFINISHED)) {
        throw new BadRequestException('Уже есть в базе данных')
      }
    }

    return this.prisma.suggestion.create({
      data: {
        ...data,
        userId,
        link: suggest.link,
      },
    })
  }

  async changeSuggestionLimit(limit: number): Promise<Limit> {
    return this.prisma.limit.update({
      where: { name: 'SUGGESTION' },
      data: { quantity: limit },
    })
  }

  private async fetchShikimori(id: number): Promise<CreateSuggestion> {
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
        type: $Enums.SuggestionsType.WATCH,
        posterUrl: anime.poster.originalUrl,
        grade: anime.score.toString(),
        genre: $Enums.PrismaGenres.ANIME,
      }
      return data
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      throw new BadRequestException(`Не удалось получить данные из API Shikimori: ${error.message || 'неизвестная ошибка'}`)
    }
  }

  private async fetchKinopoisk(id: number): Promise<CreateSuggestion> {
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

      const data = {
        title: result.nameRu || result.nameEn || result.nameOriginal,
        type: $Enums.SuggestionsType.WATCH,
        posterUrl: result.posterUrl,
        grade: result.ratingImdb?.toString(),
        genre,
      }
      return data
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      throw new BadRequestException(`Не удалось получить данные из API Кинопоиска: ${error.message || 'неизвестная ошибка'}`)
    }
  }

  private mapKinopoiskGenre(genres: Array<{ genre: string }>, type: string): $Enums.PrismaGenres {
    if (!genres || genres.length === 0) {
      throw new BadRequestException('Не удалось определить жанр из API Кинопоиска')
    }

    const hasAnime = genres.some(({ genre }) => genre.toLowerCase() === 'аниме')
    const hasCartoon = genres.some(({ genre }) => genre.toLowerCase() === 'мультфильм')

    if (hasAnime) {
      return $Enums.PrismaGenres.ANIME
    }

    if (hasCartoon) {
      return $Enums.PrismaGenres.CARTOON
    }

    return this.mapKinopoiskType(type)
  }

  private mapKinopoiskType(type: string): $Enums.PrismaGenres {
    const seriesTypes = ['TV_SERIES', 'MINI_SERIES', 'TV_SHOW']

    if (seriesTypes.includes(type)) {
      return $Enums.PrismaGenres.SERIES
    }

    return $Enums.PrismaGenres.MOVIE
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

  private async fetchIGDB(gameSlug: string): Promise<CreateSuggestion> {
    if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET) {
      throw new BadRequestException('API ключи для IGDB не настроены')
    }

    try {
      const tokenResponse = await fetch(
        `https://id.twitch.tv/oauth2/token?client_id=${env.TWITCH_CLIENT_ID}&client_secret=${env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
        { method: 'POST' },
      )

      if (!tokenResponse.ok) {
        throw new BadRequestException('Не удалось получить токен доступа для IGDB API')
      }

      const tokenData = await tokenResponse.json()
      const accessToken = tokenData.access_token

      const response = await fetch(
        'https://api.igdb.com/v4/games',
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Client-ID': env.TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${accessToken}`,
          },
          body: `fields name,rating,cover.url; where slug = "${gameSlug}";`,
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
        type: $Enums.SuggestionsType.GAME,
        posterUrl: coverUrl,
        grade: game.rating ? (game.rating / 10).toFixed(1) : null,

      }
      return data
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      throw new BadRequestException(`Не удалось получить данные из API IGDB: ${error.message || 'неизвестная ошибка'}`)
    }
  }
}

interface CreateSuggestion {
  title: string
  type: $Enums.SuggestionsType
  posterUrl?: string
  grade?: string
  genre?: $Enums.PrismaGenres
}
