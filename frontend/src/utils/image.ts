export type ImageVariant = 'poster' | 'avatar'

function encodeBase64(url: string): string {
  const bytes = new TextEncoder().encode(url)
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
}

/**
 * Браузер уже держит картинку (память/диск/декод) и может показать её в первом же кадре.
 * `complete` без `naturalWidth` — это битая картинка, её показывать нельзя.
 */
export function isImageReady(
  image: Pick<HTMLImageElement, 'complete' | 'naturalWidth'> | null | undefined,
): boolean {
  return Boolean(image?.complete && image.naturalWidth > 0)
}

export function getImageUrl(originalUrl: string, variant?: ImageVariant): string {
  if (!originalUrl) return ''

  const params = new URLSearchParams({ urlEncoded: encodeBase64(originalUrl) })
  if (variant) params.set('variant', variant)

  return `/api/img?${params.toString()}`
}
