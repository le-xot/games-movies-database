const DIST_ASSETS_DIRECTORY = /[\\/]dist[\\/]assets[\\/]/
const DIST_IMAGES_DIRECTORY = /[\\/]dist[\\/]images[\\/]/
const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable'
// Имена картинок из public/ не хешируются, поэтому immutable тут соврёт: файл могут заменить.
const IMAGES_CACHE_CONTROL = 'public, max-age=86400'

type HeaderSetter = {
  setHeader: (name: string, value: string) => void
}

export function setAssetCacheHeaders(res: HeaderSetter, filePath: string): void {
  if (DIST_ASSETS_DIRECTORY.test(filePath)) {
    res.setHeader('Cache-Control', IMMUTABLE_CACHE_CONTROL)
    return
  }

  if (DIST_IMAGES_DIRECTORY.test(filePath)) {
    res.setHeader('Cache-Control', IMAGES_CACHE_CONTROL)
  }
}
