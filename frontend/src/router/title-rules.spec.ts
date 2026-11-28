import { describe, expect, it } from 'bun:test'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const ROUTER_SOURCE = join(import.meta.dir, 'router.ts')
const META_BLOCK = /meta:\s*\{([^}]*)\}/g
const TITLE = /title:\s*'([^']+)'/

/**
 * `meta.title` — короткая подпись, к которой `useTitle` добавляет «Лешота».
 * Если бренд уже входит в заголовок, маршрут обязан ставить
 * `titleSuffix: false`, иначе получается «… Лешота Лешота».
 */
describe('router meta.title', () => {
  it('не добавляет суффикс к заголовкам, где бренд уже есть', async () => {
    const source = await readFile(ROUTER_SOURCE, 'utf8')
    const offenders: string[] = []

    for (const block of source.matchAll(META_BLOCK)) {
      const body = block[1] ?? ''
      const title = TITLE.exec(body)?.[1]
      if (!title) continue
      if (title.includes('Лешота') && !body.includes('titleSuffix: false')) {
        offenders.push(title)
      }
    }

    expect(offenders).toEqual([])
  })
})
