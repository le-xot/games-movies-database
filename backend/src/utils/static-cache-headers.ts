const ASSETS_DIRECTORY = /[\\/]assets[\\/]/
const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable'

type HeaderSetter = {
  setHeader: (name: string, value: string) => void
}

export function setAssetCacheHeaders(res: HeaderSetter, filePath: string): void {
  if (ASSETS_DIRECTORY.test(filePath)) {
    res.setHeader('Cache-Control', IMMUTABLE_CACHE_CONTROL)
  }
}
