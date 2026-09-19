import { timingSafeEqual } from 'node:crypto'
import { BadRequestException } from '@nestjs/common'

export function assertOAuthState(stored: string | undefined, provided: string | undefined): void {
  const expected = Buffer.from(stored ?? '')
  const actual = Buffer.from(provided ?? '')

  if (expected.length === 0 || actual.length === 0 || expected.length !== actual.length) {
    throw new BadRequestException('Invalid OAuth state')
  }
  if (!timingSafeEqual(expected, actual)) {
    throw new BadRequestException('Invalid OAuth state')
  }
}
