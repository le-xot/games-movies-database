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
})
