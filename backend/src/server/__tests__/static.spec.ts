import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createTestGateway } from '@backend/__tests__/helpers/gateway-stub'
import { createHttpServer } from '@backend/server/http'

/** Как в проде: каталог собранного фронта называется dist — от него зависит логика кеша. */
let root: string

function build() {
  return createHttpServer(createTestGateway(), {
    corsOrigins: [],
    production: false,
    staticRoot: root,
  })
}

async function get(path: string) {
  return await build().handle(new Request(`http://localhost${path}`))
}

beforeAll(() => {
  root = join(mkdtempSync(join(tmpdir(), 'gmd-static-')), 'dist')
  mkdirSync(join(root, 'assets'), { recursive: true })
  mkdirSync(join(root, 'images'), { recursive: true })
  writeFileSync(join(root, 'index.html'), '<!doctype html><title>app</title>')
  writeFileSync(join(root, 'assets/app-abc123.js'), 'console.log("app")')
  writeFileSync(join(root, 'images/lexot.webp'), 'binary')
})

afterAll(() => {
  rmSync(join(root, '..'), { recursive: true, force: true })
})

describe('static assets', () => {
  it('serves hashed assets as immutable', async () => {
    const response = await get('/assets/app-abc123.js')

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('public, max-age=31536000, immutable')
    expect(await response.text()).toBe('console.log("app")')
  })

  it('serves public images with a short cache', async () => {
    const response = await get('/images/lexot.webp')

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('public, max-age=86400')
  })

  it('falls back to index.html for client-side routes', async () => {
    const response = await get('/db/games')

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    expect(response.headers.get('cache-control')).toBe('no-cache')
    expect(await response.text()).toContain('<title>app</title>')
  })

  it('does not let a request escape the static root', async () => {
    const response = await get('/%2e%2e/%2e%2e/etc/passwd')

    expect(await response.text()).toContain('<title>app</title>')
  })

  it('keeps /api routes above the static fallback', async () => {
    const response = await get('/api/auth/me')

    expect(response.status).toBe(401)
    expect(await response.json()).toMatchObject({ statusCode: 401 })
  })
})
