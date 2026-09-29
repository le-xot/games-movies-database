import { fileURLToPath } from 'node:url'
import { generateApi } from 'swagger-typescript-api'

const API_FILE = fileURLToPath(new URL('../src/lib/api.ts', import.meta.url))

/** Генерирует src/lib/api.ts из backend /docs-json. Возвращает false, если бэкенд недоступен. */
export async function generateSwagger(): Promise<boolean> {
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      await generateApi({
        fileName: 'api.ts',
        url: 'http://localhost:3000/docs-json',
        output: fileURLToPath(new URL('../src/lib', import.meta.url)),
        generateClient: true,
        generateRouteTypes: true,
        httpClientType: 'fetch',
        singleHttpClient: true,
        extractEnums: true,
      })
      await stripTsNocheck()
      console.log('✅ api.ts сгенерирован из /docs-json')
      return true
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  console.error(
    '❌ Не удалось сгенерировать api.ts: backend на http://localhost:3000 недоступен. ' +
      'Запустите backend и перезапустите dev, либо выполните "bun run generate:api".',
  )
  return false
}

/** Сгенерированный файл чисто проходит tsc, поэтому убираем глушение типов — регрессии генератора упадут в typecheck. */
async function stripTsNocheck(): Promise<void> {
  const content = await Bun.file(API_FILE).text()
  const stripped = content
    .split('\n')
    .filter((line) => line.trim() !== '// @ts-nocheck')
    .join('\n')
  if (stripped !== content) {
    await Bun.write(API_FILE, stripped)
    console.log('🧹 Убран // @ts-nocheck из api.ts')
  }
}

if (import.meta.main) {
  const ok = await generateSwagger()
  process.exit(ok ? 0 : 1)
}
