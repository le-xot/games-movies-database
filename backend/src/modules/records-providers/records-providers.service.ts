import { env } from 'node:process'
import { PrismaService } from '@/database/prisma.service'
import { BadRequestException, Injectable } from '@nestjs/common'
import { $Enums } from '@prisma/client'
import { TwitchService } from '../twitch/twitch.service'

interface PreparedData {
  title: string
  posterUrl: string
  genre: $Enums.RecordGenre
  link: string
}

@Injectable()
export class RecordsProvidersService {
  constructor(private readonly prisma: PrismaService, private readonly twitch: TwitchService) { }

  private readonly linkPatterns: Record<string, { regex: RegExp, parse: (m: RegExpMatchArray) => number | string }> = {
    shikimori: {
      regex: /shikimori\.one\/animes\/[a-z]?(\d+)/,
      parse: m => Number(m[1]),
    },
    kinopoisk: {
      regex: /kinopoisk\.ru\/(film|series)\/(\d+)/,
      parse: m => Number(m[2]),
    },
    igdb: {
      regex: /igdb\.com\/games\/([^/]+)/,
      parse: m => m[1],
    },
    steam: {
      regex: /(?:store\.steampowered|steamcommunity)\.com\/app\/(\d+)/,
      parse: m => Number(m[1]),
    },
    imdb: {
      regex: /imdb\.com\/title\/(tt\d+)/,
      parse: m => m[1],
    },
    reyohoho: {
      regex: /reyohoho\.(?:github\.io\/reyohoho|gitlab\.io\/reyohoho|vercel\.app|onrender\.com|serv00\.net)\/movie\/(\d+)|reyohoho-gitlab\.vercel\.app\/movie\/(\d+)|reyohoho(?:-vue)?\.(?:surge\.sh|vercel\.app)#(\d+)/,
      parse: m => Number(m[1] || m[2] || m[3]),
    },
  }

  private readonly serviceFetchers: Record<string, (id: any) => Promise<PreparedData>> = {
    shikimori: id => this.fetchShikimori(id),
    kinopoisk: id => this.fetchKinopoisk(id),
    igdb: id => this.fetchIGDB(id),
    steam: id => this.fetchIGDBFromSteam(id),
    imdb: id => this.fetchImdb(id),
    reyohoho: id => this.fetchReyohoho(id),
  }

  private readonly recordValidationRules = [
    { condition: (r: any) => r.type === $Enums.RecordType.AUCTION, message: 'Уже есть в аукционе' },
    { condition: (r: any) => r.type === $Enums.RecordType.SUGGESTION, message: 'Уже есть в советах' },
    { condition: (r: any) => r.type === $Enums.RecordType.WRITTEN && r.status === $Enums.RecordStatus.DONE, message: 'Уже есть в базе со статусом "Готово"' },
    { condition: (r: any) => r.type === $Enums.RecordType.WRITTEN && r.status === $Enums.RecordStatus.DROP, message: 'Уже есть в базе со статусом "Дроп"' },
    { condition: (r: any) => r.type === $Enums.RecordType.WRITTEN && r.status === $Enums.RecordStatus.NOTINTERESTED, message: 'Уже есть в базе со статусом "Не интересно"' },
    { condition: (r: any) => r.type === $Enums.RecordType.WRITTEN && r.status === $Enums.RecordStatus.PROGRESS, message: 'Уже есть в базе со статусом "В процессе"' },
    { condition: (r: any) => r.type === $Enums.RecordType.WRITTEN && r.status === $Enums.RecordStatus.QUEUE, message: 'Уже есть в очереди' },
    { condition: (r: any) => r.type === $Enums.RecordType.WRITTEN && r.status === $Enums.RecordStatus.UNFINISHED, message: 'Уже есть в базе со статусом "Нет концовки"' },
    { condition: (r: any) => r.type === $Enums.RecordType.WRITTEN && r.status === null, message: 'Уже есть в базе' },
  ]

  private validateExistingRecord(record: any) {
    for (const rule of this.recordValidationRules) {
      if (rule.condition(record)) {
        throw new BadRequestException(rule.message)
      }
    }
  }

  async prepareData(data: { link: string, userId: string }): Promise<PreparedData> {
    const { service, id } = this.parseLink(data.link)
    const fetcher = this.serviceFetchers[service]
    if (!fetcher) throw new BadRequestException('Неподдерживаемый сервис')

    const newRecord = await fetcher(id)
    if (!newRecord.title) throw new BadRequestException('Не удалось получить данные из API')

    const foundedRecord = await this.prisma.record.findFirst({
      where: {
        link: newRecord.link,
        genre: newRecord.genre,
      },
    })

    if (foundedRecord) {
      this.validateExistingRecord(foundedRecord)
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

  private async fetchImdb(id: string) {
    return await this.fetchTmdb(id)
  }

  private async fetchTmdb(imdbId: string): Promise<PreparedData> {
    if (!env.TMBD_API) throw new BadRequestException('API ключ для TMDB не настроен')

    const findResp = await fetch(
      `https://api.themoviedb.org/3/find/${imdbId}?api_key=${env.TMBD_API}&language=ru-RU&external_source=imdb_id`,
      { proxy: env.PROXY },
    )

    if (findResp.status !== 200) throw new BadRequestException(`Ошибка TMDB find: ${findResp.status}`)

    const findData = await findResp.json() as any
    const movie = findData.movie_results?.[0]
    const tv = findData.tv_results?.[0]

    const item = movie ?? tv
    if (!item) throw new BadRequestException('Не удалось найти объект в TMDB')

    const genre = await this.mapTmdbGenre(movie, tv)

    const posterUrl = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : ''

    return {
      title: movie?.title ?? tv?.name,
      posterUrl,
      genre,
      link: `https://www.imdb.com/title/${imdbId}`,
    }
  }

  private async mapTmdbGenre(
    movie?: { genre_ids?: number[], origin_country?: string[], production_countries?: { iso_3166_1: string }[] },
    tv?: { genre_ids?: number[], origin_country?: string[], production_countries?: { iso_3166_1: string }[] },
  ): Promise<$Enums.RecordGenre> {
    const item = movie ?? tv

    const hasAnimation = item?.genre_ids?.includes(16)
    const isJapanese
      = item?.origin_country?.includes('JP')
        || item?.production_countries?.some(c => c.iso_3166_1 === 'JP')

    if (tv) {
      if (hasAnimation && isJapanese) {
        await this.checkGenrePermission($Enums.RecordGenre.ANIME, 'Прошу пока аниме не советовать')
        return $Enums.RecordGenre.ANIME
      }
      await this.checkGenrePermission($Enums.RecordGenre.SERIES, 'Прошу пока сериалы не советовать')
      return $Enums.RecordGenre.SERIES
    }

    if (movie) {
      if (hasAnimation && isJapanese) {
        await this.checkGenrePermission($Enums.RecordGenre.ANIME, 'Прошу пока аниме не советовать')
        return $Enums.RecordGenre.ANIME
      }
      if (hasAnimation) {
        await this.checkGenrePermission($Enums.RecordGenre.CARTOON, 'Прошу пока мультфильмы не советовать')
        return $Enums.RecordGenre.CARTOON
      }
      await this.checkGenrePermission($Enums.RecordGenre.MOVIE, 'Прошу пока фильмы не советовать')
      return $Enums.RecordGenre.MOVIE
    }

    throw new BadRequestException('Не удалось определить жанр из TMDB')
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

    const anime = (await response.json() as any).data?.animes?.[0]
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

    const result = await response.json() as any
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

  private async fetchIGDBFromSteam(appId: string) {
    const accessToken = await this.twitch.getAppAccessToken()

    const body = `fields game; where uid = "${appId}" & external_game_source = 1; limit 1;`

    const externalResp = await fetch('https://api.igdb.com/v4/external_games', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Client-ID': env.TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'text/plain; charset=UTF-8',
      },
      body,
    })
    if (!externalResp.ok) throw new BadRequestException(`Не удалось получить данные external_games IGDB: ${externalResp.status}`)

    const externalData = await externalResp.json()
    if (!externalData[0]?.game) throw new BadRequestException('Игра не найдена в IGDB по Steam ID')

    return this.fetchIGDBGame(`id = ${externalData[0].game}`)
  }

  private async fetchReyohoho(id: number): Promise<PreparedData> {
    return await this.fetchKinopoisk(id)
  }
}
