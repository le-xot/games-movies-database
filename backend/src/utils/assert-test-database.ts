/** Guard инфраструктурных скриптов: работать разрешено только с БД, чьё имя заканчивается на `_test`. */
export function assertTestDatabase(url: string): void {
  let name: string
  try {
    name = new URL(url).pathname.replace(/^\//, '')
  } catch {
    throw new Error(`TEST_DATASOURCE_URL must be a URL DSN, got "${url}"`)
  }
  if (!name) throw new Error('TEST_DATASOURCE_URL has no database name')
  if (!name.endsWith('_test')) {
    throw new Error(`Refusing to run integration tests against non-test database "${name}"`)
  }
}
