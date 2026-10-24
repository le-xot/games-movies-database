import { describe, expect, it } from 'bun:test'
import { parseWsMessage } from '../ws-message'

describe('parseWsMessage', () => {
  it('parses a known event', () => {
    expect(
      parseWsMessage('{"event":"update-records","payload":{"id":1,"action":"created"}}'),
    ).toEqual({ event: 'update-records', payload: { id: 1, action: 'created' } })
  })

  it('ignores unknown events', () => {
    expect(parseWsMessage('{"event":"whatever","payload":{}}')).toBeNull()
  })

  it('ignores broken frames instead of throwing', () => {
    expect(parseWsMessage('not json')).toBeNull()
    expect(parseWsMessage('null')).toBeNull()
    expect(parseWsMessage(new Uint8Array([1]))).toBeNull()
  })
})
