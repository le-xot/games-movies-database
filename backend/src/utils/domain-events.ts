type Listener = (payload: never) => void

/**
 * Минимальный типизированный эмиттер вместо `@nestjs/event-emitter`.
 *
 * Умеет ровно то, что используют сервисы и мост в WebSocket: подписка и
 * синхронная рассылка. Не роняет прод, если подписчик бросил исключение —
 * одно плохое событие не должно ломать запрос.
 */
export class DomainEvents {
  private readonly listeners = new Map<string, Set<Listener>>()

  on(event: string, listener: Listener): this {
    const bucket = this.listeners.get(event) ?? new Set<Listener>()
    bucket.add(listener)
    this.listeners.set(event, bucket)

    return this
  }

  off(event: string, listener: Listener): this {
    this.listeners.get(event)?.delete(listener)

    return this
  }

  emit(event: string, payload: unknown): boolean {
    const bucket = this.listeners.get(event)
    if (!bucket || bucket.size === 0) return false

    for (const listener of bucket) {
      try {
        ;(listener as (value: unknown) => void)(payload)
      } catch (error) {
        console.warn(`[events] обработчик ${event} упал: ${String(error)}`)
      }
    }

    return true
  }
}
