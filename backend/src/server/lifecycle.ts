/**
 * Lifecycle composition root: сервис регистрируется там же, где создаётся,
 * поэтому «забыли добавить в список started/stoppable» невозможно.
 *
 * Имена хуков остались от Nest (`onModuleInit` и т. д.) — их реализуют сервисы,
 * но вызывает их этот реестр. Ошибка одного хука не отменяет остальные:
 * недоступная погода или Telegram не должны ронять сайт.
 */
export interface InitHooks {
  onModuleInit?(): unknown
  onApplicationBootstrap?(): unknown
}

export interface DestroyHooks {
  onModuleDestroy?(): unknown
}

import { Logger } from '@backend/utils/logger'

type LogFn = (message: string) => void

export class Lifecycle {
  private readonly services: object[] = []

  constructor(private readonly log: LogFn = (message) => new Logger('Lifecycle').warn(message)) {}

  /** Регистрирует сервис и возвращает его же — точки регистрации не забыть. */
  add<T extends object>(service: T): T {
    this.services.push(service)

    return service
  }

  async init(): Promise<void> {
    for (const service of this.services) {
      const hooks = service as InitHooks
      await this.run(service, 'onModuleInit', hooks.onModuleInit)
      await this.run(service, 'onApplicationBootstrap', hooks.onApplicationBootstrap)
    }
  }

  async close(): Promise<void> {
    for (const service of this.services) {
      const hooks = service as DestroyHooks
      await this.run(service, 'onModuleDestroy', hooks.onModuleDestroy)
    }
  }

  private async run(service: object, hook: string, fn?: () => unknown): Promise<void> {
    if (!fn) return

    try {
      await fn.call(service)
    } catch (error) {
      this.log(`[lifecycle] ${service.constructor.name}.${hook} упал: ${String(error)}`)
    }
  }
}
