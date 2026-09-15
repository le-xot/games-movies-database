import process from 'node:process'
import * as schema from '@gmd/database/schema'
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

@Injectable()
export class DrizzleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DrizzleService.name)
  readonly pool: Pool
  readonly db: NodePgDatabase<typeof schema>

  constructor() {
    this.pool = new Pool({ connectionString: process.env.DATASOURCE_URL ?? '' })
    this.pool.on('error', (error) => this.logger.error('Database pool error', error))
    this.db = drizzle(this.pool, { schema })
  }

  async onModuleInit() {
    this.logger.log('🔌 Connecting to database')
    await this.pool.query('select 1')
    this.logger.log('✅ Connected to database')
  }

  async onModuleDestroy() {
    this.logger.log('Closing database pool')
    await this.pool.end()
  }
}
