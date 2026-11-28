export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

let minLevel: LogLevel = 'info'

/**
 * Уровень задаётся один раз при старте (`main.ts` из `env.LOG_LEVEL`).
 * По умолчанию `info`: в тестах и юнит-прогонах `debug` не нужен.
 */
export function configureLogger(level: LogLevel): void {
  minLevel = level
}

/**
 * Логгер без фреймворка. Формат повторяет Nest-логгер, чтобы записи в проде
 * не изменились: `[Context] message`. Уровни фильтруются по `minLevel`.
 */
export class Logger {
  constructor(private readonly context?: string) {}

  log(message: unknown, ...params: unknown[]): void {
    this.write('info', message, params)
  }

  debug(message: unknown, ...params: unknown[]): void {
    this.write('debug', message, params)
  }

  warn(message: unknown, ...params: unknown[]): void {
    this.write('warn', message, params)
  }

  error(message: unknown, ...params: unknown[]): void {
    this.write('error', message, params)
  }

  private write(level: LogLevel, message: unknown, params: unknown[]): void {
    if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[minLevel]) return

    const text = typeof message === 'string' ? message : String(message)
    const line = this.context ? `[${this.context}] ${text}` : text

    if (level === 'error') console.error(line, ...params)
    else if (level === 'warn') console.warn(line, ...params)
    else console.log(line, ...params)
  }
}
