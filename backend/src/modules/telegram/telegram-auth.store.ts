import { randomBytes } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import { RedisClient } from 'bun'
import {
  TELEGRAM_AUTH_CONFIRMED_TTL_SECONDS,
  TELEGRAM_AUTH_KEY_PREFIX,
  TELEGRAM_AUTH_TTL_SECONDS,
} from './telegram.constants'
import type { TelegramAuthMode, TelegramAuthRecord, TelegramProfile } from './telegram.types'

@Injectable()
export class TelegramAuthStore {
  private readonly logger = new Logger(TelegramAuthStore.name)

  constructor(private readonly client: RedisClient) {}

  async create(mode: TelegramAuthMode, userId?: string, origin?: string): Promise<string> {
    const token = randomBytes(32).toString('base64url')
    const record: TelegramAuthRecord = {
      status: 'pending',
      mode,
      userId,
      origin,
      createdAt: Date.now(),
    }

    await this.client.send('SET', [
      this.key(token),
      JSON.stringify(record),
      'EX',
      String(TELEGRAM_AUTH_TTL_SECONDS),
    ])

    return token
  }

  async get(token: string): Promise<TelegramAuthRecord | null> {
    const raw = await this.client.send('GET', [this.key(token)])
    return this.parse(raw)
  }

  async confirm(token: string, profile: TelegramProfile): Promise<boolean> {
    const record = await this.get(token)
    if (!record) return false

    const confirmed: TelegramAuthRecord = { ...record, status: 'confirmed', profile }
    await this.client.send('SET', [
      this.key(token),
      JSON.stringify(confirmed),
      'EX',
      String(TELEGRAM_AUTH_CONFIRMED_TTL_SECONDS),
    ])

    return true
  }

  async consume(token: string): Promise<TelegramAuthRecord | null> {
    const raw = await this.client.send('GETDEL', [this.key(token)])
    return this.parse(raw)
  }

  async remove(token: string): Promise<void> {
    await this.client.send('DEL', [this.key(token)])
  }

  private parse(raw: unknown): TelegramAuthRecord | null {
    if (typeof raw !== 'string' || raw.length === 0) return null
    try {
      return JSON.parse(raw) as TelegramAuthRecord
    } catch {
      this.logger.warn('Failed to parse telegram auth record')
      return null
    }
  }

  private key(token: string): string {
    return `${TELEGRAM_AUTH_KEY_PREFIX}${token}`
  }
}
