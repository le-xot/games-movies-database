/**
 * Логгер без фреймворка. Формат сознательно повторяет Nest-логгер, чтобы записи
 * в проде не изменились: `[Context] message`.
 */
export class Logger {
  constructor(private readonly context?: string) {}

  private prefix(): string {
    return this.context ? `[${this.context}] ` : ''
  }

  private write(level: string, message: unknown, params: unknown[]): void {
    const text = typeof message === 'string' ? message : String(message)
    const line = `${this.prefix()}${text}`

    if (level === 'ERROR') console.error(line, ...params)
    else if (level === 'WARN') console.warn(line, ...params)
    else console.log(line, ...params)
  }

  log(message: unknown, ...params: unknown[]): void {
    this.write('LOG', message, params)
  }

  warn(message: unknown, ...params: unknown[]): void {
    this.write('WARN', message, params)
  }

  error(message: unknown, ...params: unknown[]): void {
    this.write('ERROR', message, params)
  }

  debug(message: unknown, ...params: unknown[]): void {
    this.write('DEBUG', message, params)
  }
}
