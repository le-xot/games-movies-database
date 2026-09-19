export type ImageVariant = 'poster' | 'avatar'

function encodeBase64(url: string): string {
  const bytes = new TextEncoder().encode(url)
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
}

export function getImageUrl(originalUrl: string, variant?: ImageVariant): string {
  if (!originalUrl) return ''

  const params = new URLSearchParams({ urlEncoded: encodeBase64(originalUrl) })
  if (variant) params.set('variant', variant)

  return `/api/img?${params.toString()}`
}
