export interface EventCoalescerOptions {
  handlers: Record<string, () => void>
  delay?: number
}

export function createEventCoalescer({ handlers, delay = 150 }: EventCoalescerOptions) {
  const pending = new Set<string>()
  let timer: ReturnType<typeof setTimeout> | null = null

  function flush() {
    timer = null
    for (const target of pending) {
      handlers[target]?.()
    }
    pending.clear()
  }

  function enqueue(target: string) {
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
