export function getImageUrl(originalUrl: string): string {
  if (!originalUrl) return ''

  const urlEncoded = btoa(originalUrl)
  return `/api/img?urlEncoded=${urlEncoded}`
}
