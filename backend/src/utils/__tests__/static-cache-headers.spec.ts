import { describe, expect, it, mock } from 'bun:test'
import { setAssetCacheHeaders } from '../static-cache-headers'

const makeRes = () => ({ setHeader: mock((_name: string, _value: string) => {}) })

describe('setAssetCacheHeaders', () => {
  it('sets immutable cache control for hashed assets', () => {
    const res = makeRes()

    setAssetCacheHeaders(res, '/app/frontend/dist/assets/index-Dg3RdX1P.js')

    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=31536000, immutable',
    )
  })

  it('leaves index.html revalidatable', () => {
    const res = makeRes()

    setAssetCacheHeaders(res, '/app/frontend/dist/index.html')

    expect(res.setHeader).not.toHaveBeenCalled()
  })

  it('does not treat lookalike directories as hashed assets', () => {
    const res = makeRes()

    setAssetCacheHeaders(res, '/app/frontend/dist/my-assets/app.js')

    expect(res.setHeader).not.toHaveBeenCalled()
  })

  it('does not treat an ancestor directory named assets as the build output', () => {
    const res = makeRes()

    setAssetCacheHeaders(res, '/var/www/assets/site/dist/index.html')

    expect(res.setHeader).not.toHaveBeenCalled()
  })

  it('matches hashed assets under dist/assets on any platform separator', () => {
    const res = makeRes()

    setAssetCacheHeaders(res, 'C:\\app\\frontend\\dist\\assets\\index-Dg3RdX1P.js')

    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=31536000, immutable',
    )
  })

  it('keeps public images cached between visits', () => {
    const res = makeRes()

    setAssetCacheHeaders(res, '/app/frontend/dist/images/lexot.webp')

    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=86400')
  })

  it('matches public images on any platform separator', () => {
    const res = makeRes()

    setAssetCacheHeaders(res, 'C:\\app\\frontend\\dist\\images\\lexot.webp')

    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=86400')
  })

  it('does not treat lookalike image directories as build images', () => {
    const res = makeRes()

    setAssetCacheHeaders(res, '/app/frontend/dist/my-images/lexot.webp')

    expect(res.setHeader).not.toHaveBeenCalled()
  })
})
