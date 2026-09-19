import { describe, expect, it } from 'bun:test'
import { AppController } from '../app.controller'

describe('AppController', () => {
  it('reports status without leaking the version', () => {
    expect(new AppController().health()).toEqual({ status: 'ok' })
  })
})
