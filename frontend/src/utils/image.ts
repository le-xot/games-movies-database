export function getImageUrl(originalUrl: string): string {
  if (!originalUrl) return ''

  const encodeUrl = (url: string): string => {
    try {
      return btoa(unescape(encodeURIComponent(url)))
    } catch {
      return encodeURIComponent(url)
    }
  }

  const urlEncoded = encodeUrl(originalUrl)
  return `/api/img?urlEncoded=${urlEncoded}`
}
