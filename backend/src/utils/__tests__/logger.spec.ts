import { afterEach, describe, expect, it, spyOn } from 'bun:test'
import { Logger, configureLogger } from '@backend/utils/logger'

function capture(level: 'log' | 'warn' | 'error') {
  return spyOn(console, level).mockImplementation(() => {})
}

afterEach(() => configureLogger('info'))

describe('Logger', () => {
  it('prefixes messages with the context', () => {
    const log = capture('log')

    new Logger('Weather').log('fetched')

    expect(log).toHaveBeenCalledWith('[Weather] fetched')
    log.mockRestore()
  })

  it('keeps the level-specific console method', () => {
    const error = capture('error')
    const warn = capture('warn')

    new Logger('X').error('boom')
    new Logger('X').warn('hmm')

    expect(error).toHaveBeenCalledWith('[X] boom')
    expect(warn).toHaveBeenCalledWith('[X] hmm')
    error.mockRestore()
    warn.mockRestore()
  })

  it('filters out messages below the configured level', () => {
    configureLogger('warn')
    const log = capture('log')
    const warn = capture('warn')

    new Logger('X').debug('hidden')
    new Logger('X').log('hidden')
    new Logger('X').warn('shown')

    expect(log).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledTimes(1)
    log.mockRestore()
    warn.mockRestore()
  })

  it('hides debug by default', () => {
    configureLogger('info')
    const log = capture('log')

    new Logger('X').debug('hidden')

    expect(log).not.toHaveBeenCalled()
    log.mockRestore()
  })

  it('stringifies non-string messages', () => {
    const log = capture('log')

    new Logger().log({ a: 1 })

    expect(log).toHaveBeenCalledWith('[object Object]')
    log.mockRestore()
  })
})
