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

  const candidates = base.endsWith('.ts') ? [base] : [`${base}.ts`, join(base, 'index.ts')]

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

describe('архитектура backend', () => {
  /**
   * Ловушка на мёртвый код: файл, который никто не импортирует, — это либо
   * забытая реализация (как Nest-era DTO), либо намеренная точка входа.
   * Первое правим, второе добавляем в `ENTRYPOINTS` с комментарием.
   */
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

  /**
   * Class-DTO — наследие Nest: инстансов не было, формы дублировали TypeBox.
   * Доменные формы живут интерфейсами в `entities/`; новая `.dto.ts` или
   * `export class *DTO` — регресс (B-12).
   */
  it('в домене нет class-DTO', async () => {
    const files = await collectTypeScriptFiles(join(SOURCE_ROOT, 'modules'))
    const offenders: string[] = []

    for (const file of files) {
      const rel = relative(SOURCE_ROOT, file)
      if (rel.endsWith('.dto.ts')) {
        offenders.push(rel)
        continue
      }

      const text = await readFile(file, 'utf8')
      if (/export class \w+DTO\b/.test(text) || /new \w+DTO\(/.test(text)) {
        offenders.push(rel)
      }
    }

    expect(offenders.sort()).toEqual([])
  })

  /**
   * Доступ к БД — только через репозитории: сервис с `DrizzleService` или
   * импортом схемы снова открывает второй путь к таблицам.
   */
  it('сервисы домена не импортируют БД напрямую', async () => {
    const modulesDir = join(SOURCE_ROOT, 'modules')
    const files = (await collectTypeScriptFiles(modulesDir)).filter(
      (file) => file.endsWith('.service.ts') && !file.endsWith('.spec.ts'),
    )
    const offenders: string[] = []

    for (const file of files) {
      const text = await readFile(file, 'utf8')
      if (text.includes('@backend/database/drizzle.service') || text.includes('@gmd/database')) {
        offenders.push(relative(SOURCE_ROOT, file))
      }
    }

    expect(offenders.sort()).toEqual([])
  })

  /**
   * Гейтвей знает только порты: из `modules/` ему разрешены чистые функции и
   * константы (`auth.oauth-state`, `telegram.constants`, `cocktail.types`),
   * но не классы сервисов — иначе HTTP-слой тянет весь домен.
   */
  it('гейтвей не импортирует доменные сервисы', async () => {
    const gatewayFiles = (await collectTypeScriptFiles(join(SOURCE_ROOT, 'gateway'))).filter(
      (file) => !file.endsWith('.spec.ts'),
    )
    const offenders: string[] = []

    for (const file of gatewayFiles) {
      const text = await readFile(file, 'utf8')
      for (const match of text.matchAll(/from '(@backend\/modules\/[^']+)'/g)) {
        const specifier = match[1] ?? ''
        if (/\.service$/.test(specifier)) {
          offenders.push(`${relative(SOURCE_ROOT, file)} -> ${specifier}`)
        }
      }
    }

    expect(offenders).toEqual([])
  })

  /**
   * Конфигурация читается в одном месте — `utils/enviroments.ts`. Тестовые
   * харнессы (`__tests__`, `__integration__`, `__e2e__`) — исключение: они
   * получают DSN из окружения раннера, а не из конфигурации приложения.
   */
  it('читает process.env только через utils/enviroments.ts', async () => {
    const files = await collectTypeScriptFiles(SOURCE_ROOT)
    const offenders: string[] = []

    for (const file of files) {
      const rel = relative(SOURCE_ROOT, file)
      // Тестовые харнессы — в любом вложенном каталоге (`modules/x/__tests__`).
      if (
        rel === 'utils/enviroments.ts' ||
        /(^|\/)(__tests__|__integration__|__e2e__)\//.test(rel)
      ) {
        continue
      }

      const text = await readFile(file, 'utf8')
      if (/\bprocess\.env\b/.test(text)) offenders.push(rel)
    }

    expect(offenders.sort()).toEqual([])
  })
})
