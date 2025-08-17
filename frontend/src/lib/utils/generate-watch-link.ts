export function generateWatchLink(originalLink: string): string | null {
  const shikimoriMatch = originalLink.match(/shikimori\.one\/animes\/([a-z]?\d+)/)
  if (shikimoriMatch) {
    const movieId = shikimoriMatch[1]
    return `https://reyohoho.github.io/reyohoho/#shiki${movieId}`
  }

  const kinopoiskMatch = originalLink.match(/kinopoisk\.ru\/(film|series)\/(\d+)/)
  if (kinopoiskMatch) {
    const movieId = kinopoiskMatch[2]
    return `https://reyohoho.github.io/reyohoho/#${movieId}`
  }

  const imdbMatch = originalLink.match(/imdb\.com\/title\/(tt\d+)/)
  if (imdbMatch) {
    const movieId = imdbMatch[1]
    return `https://reyohoho.github.io/reyohoho/#imdb=${movieId}`
  }

  const igdbMatch = originalLink.match(/igdb\.com\/games\/([^/]+)/)
  if (igdbMatch) {
    return originalLink
  }

  return null
}
