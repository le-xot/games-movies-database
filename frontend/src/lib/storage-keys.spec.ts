import { describe, expect, it } from 'bun:test'
import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { STORAGE_KEYS, VERSIONED_STORAGE_KEYS } from '@/lib/storage-keys'

const SOURCE_ROOT = join(import.meta.dir, '..')

async function collectSourceFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(fullPath)))
      continue
    }
    if (/\.(ts|vue)$/.test(entry.name)) files.push(fullPath)
  }

  return files
}

const STORAGE_LITERAL = /(?:localStorage|sessionStorage)\.(?:getItem|setItem|removeItem)\(\s*'/
const COMPOSABLE_LITERAL = /\buse(?:Local)?Storage(?:<[^>]*>)?\(\s*'/

describe('storage keys', () => {
  it('держит ключи уникальными и непустыми', () => {
    const values = Object.values(STORAGE_KEYS)

    expect(new Set(values).size).toBe(values.length)
    expect(values.every((value) => value.length > 0)).toBe(true)
  })

  it('сбрасывает только объявленные ключи', () => {
    const values = new Set<string>(Object.values(STORAGE_KEYS))

    for (const key of VERSIONED_STORAGE_KEYS) {
      expect(values.has(key)).toBe(true)
    }
  })

  it('не использует строковые литералы ключей вне storage-keys', async () => {
    const files = (await collectSourceFiles(SOURCE_ROOT)).filter(
      (file) => !file.endsWith('.spec.ts') && !file.endsWith('lib/storage-keys.ts'),
    )
    const offenders: string[] = []

    for (const file of files) {
      const text = await readFile(file, 'utf8')
      if (STORAGE_LITERAL.test(text) || COMPOSABLE_LITERAL.test(text)) {
        offenders.push(relative(SOURCE_ROOT, file))
      }
    }

    expect(offenders.sort()).toEqual([])
  })
})
