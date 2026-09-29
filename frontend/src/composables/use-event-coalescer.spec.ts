import { describe, expect, it } from 'bun:test'
import { createEventCoalescer } from '@/composables/use-event-coalescer'

describe('createEventCoalescer', () => {
  it('calls each enqueued handler once after the delay', async () => {
    let calls = 0
    const coalescer = createEventCoalescer<'a' | 'b'>({
      handlers: { a: () => calls++, b: () => calls++ },
      delay: 5,
    })

    coalescer.enqueue('a')
    coalescer.enqueue('a')
    coalescer.enqueue('b')
    await Bun.sleep(25)

    expect(calls).toBe(2)
  })

  it('drops pending handlers on cancel', async () => {
    let calls = 0
    const coalescer = createEventCoalescer<'a'>({
      handlers: { a: () => calls++ },
      delay: 5,
    })

    coalescer.enqueue('a')
    coalescer.cancel()
    await Bun.sleep(25)

    expect(calls).toBe(0)
  })
})
