import { describe, expect, it, mock } from 'bun:test'
import { Lifecycle } from '@backend/server/lifecycle'

describe('Lifecycle', () => {
  it('runs init and bootstrap hooks in registration order', async () => {
    const calls: string[] = []
    const lifecycle = new Lifecycle()

    lifecycle.add({
      onModuleInit() {
        calls.push('first:init')
      },
      onApplicationBootstrap() {
        calls.push('first:bootstrap')
      },
    })
    lifecycle.add({})
    lifecycle.add({
      onModuleInit() {
        calls.push('third:init')
      },
    })

    await lifecycle.init()

    expect(calls).toEqual(['first:init', 'first:bootstrap', 'third:init'])
  })

  it('binds hooks to their service', async () => {
    const calls: string[] = []
    const lifecycle = new Lifecycle()
    lifecycle.add({
      name: 'weather',
      onModuleInit() {
        calls.push(this.name)
      },
    })

    await lifecycle.init()

    expect(calls).toEqual(['weather'])
  })

  it('continues after a failing hook and logs it', async () => {
    const log = mock((_message: string) => {})
    const calls: string[] = []
    const lifecycle = new Lifecycle(log)
    lifecycle.add({
      onModuleInit() {
        throw new Error('boom')
      },
    })
    lifecycle.add({
      onModuleInit() {
        calls.push('next')
      },
    })

    await lifecycle.init()

    expect(calls).toEqual(['next'])
    expect(log).toHaveBeenCalledTimes(1)
    expect(String(log.mock.calls[0]?.[0])).toContain('onModuleInit')
  })

  it('closes services that declare onModuleDestroy', async () => {
    const calls: string[] = []
    const lifecycle = new Lifecycle()
    lifecycle.add({})
    lifecycle.add({
      onModuleDestroy() {
        calls.push('closed')
      },
    })

    await lifecycle.close()

    expect(calls).toEqual(['closed'])
  })

  it('keeps closing after a failing destroy hook', async () => {
    const log = mock((_message: string) => {})
    const calls: string[] = []
    const lifecycle = new Lifecycle(log)
    lifecycle.add({
      onModuleDestroy() {
        throw new Error('boom')
      },
    })
    lifecycle.add({
      onModuleDestroy() {
        calls.push('closed')
      },
    })

    await lifecycle.close()

    expect(calls).toEqual(['closed'])
    expect(log).toHaveBeenCalledTimes(1)
  })
})
