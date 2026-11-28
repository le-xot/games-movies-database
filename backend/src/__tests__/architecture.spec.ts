import { describe, expect, it } from 'bun:test'
import { readdir, readFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'

/**
 * Файлы, которые не импортируются, но живут намеренно:
 * entrypoints, скрипты, файлы для внешних раннеров и типы для фронта.
 */
const ENTRYPOINTS = new Set([
  'main.ts',
  'api-types.ts',
  '__e2e__/seed.ts',
  '__integration__/setup-db.ts',
  '__tests__/setup.ts',
  'modules/wordle/scripts/build-dictionary.ts',
])

const SOURCE_ROOT = resolve(import.meta.dir, '..')

async function collectTypeScriptFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectTypeScriptFiles(fullPath)))
      continue
    }
    if (entry.name.endsWith('.ts')) files.push(fullPath)
  }

  return files
}

/** Разрешает спецификатор импорта в путь файла внутри `src`. */
function resolveSpecifier(fromFile: string, specifier: string): string | null {
  let base: string
  if (specifier.startsWith('@backend/')) {
    base = join(SOURCE_ROOT, specifier.slice('@backend/'.length))
  } else if (specifier.startsWith('.')) {
    base = resolve(fromFile, '..', specifier)
  } else {
    return null
  }

  const candidates = base.endsWith('.ts')
    ? [base]
    : [base.endsWith('.vue') ? base : `${base}.ts`, join(base, 'index.ts')]

  return (
    candidates.find((candidate) => {
      try {
        return Bun.file(candidate).size > 0
      } catch {
        return false
      }
    }) ?? null
  )
}

/**
 * Ловушка на мёртвый код: файл, который никто не импортирует, — это либо
 * забытая реализация (как Nest-era DTO), либо намеренная точка входа.
 * Первое правим, второе добавляем в `ENTRYPOINTS` с комментарием.
 */
describe('архитектура backend', () => {
  it('не содержит файлов без импортёров (кроме entrypoints)', async () => {
    const files = await collectTypeScriptFiles(SOURCE_ROOT)
    const imported = new Set<string>()

    for (const file of files) {
      const text = await readFile(file, 'utf8')
      for (const match of text.matchAll(/(?:from|import)\s*\(?\s*'([^']+)'/g)) {
        const target = resolveSpecifier(file, match[1] ?? '')
        if (target) imported.add(target)
      }
    }

    const orphans = files
      .filter((file) => !file.endsWith('.spec.ts'))
      .map((file) => relative(SOURCE_ROOT, file))
      .filter((file) => !ENTRYPOINTS.has(file) && !imported.has(join(SOURCE_ROOT, file)))
      .sort()

    expect(orphans).toEqual([])
  })
})
