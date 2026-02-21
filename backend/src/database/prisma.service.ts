import process from 'node:process'
import { INestApplication, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name)
  public async onModuleInit() {
    this.logger.log('🔌 Connecting to database')
    await this.$connect()
    this.logger.log('✅ Connected to database')
  }

  public enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      this.logger.log('Process beforeExit received, closing app')
      await app.close()
      this.logger.log('App closed')
    })
  }
}
