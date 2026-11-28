import { describe, expect, it } from 'bun:test'
import { BadRequestError } from '@backend/utils/errors'
import { assertOAuthState } from '../auth.oauth-state'

describe('assertOAuthState', () => {
  it('throws when the stored cookie is missing', () => {
    expect(() => assertOAuthState(undefined, 'state-value')).toThrow(BadRequestError)
  })

  it('throws when the provided state is missing', () => {
    expect(() => assertOAuthState('state-value', undefined)).toThrow(BadRequestError)
  })

  it('throws when the state does not match', () => {
    expect(() => assertOAuthState('state-value', 'other-value')).toThrow(BadRequestError)
  })

  it('throws when lengths differ', () => {
    expect(() => assertOAuthState('state-value', 'state-value-2')).toThrow(BadRequestError)
  })

  it('passes when the state matches', () => {
    expect(() => assertOAuthState('state-value', 'state-value')).not.toThrow()
  })
})
