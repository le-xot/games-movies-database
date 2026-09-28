export interface EventCoalescerOptions<T extends string> {
  handlers: Record<T, () => void>
  delay?: number
}

export function createEventCoalescer<T extends string>({
  handlers,
  delay = 150,
}: EventCoalescerOptions<T>) {
  const pending = new Set<T>()
  let timer: ReturnType<typeof setTimeout> | null = null

  function flush() {
    timer = null
    for (const target of pending) {
      handlers[target]?.()
    }
    pending.clear()
  }

  function enqueue(target: T) {
    pending.add(target)
    if (timer !== null) clearTimeout(timer)
    timer = setTimeout(flush, delay)
  }

  function cancel() {
    pending.clear()
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  return { enqueue, cancel }
}
