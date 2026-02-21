import path from 'node:path'
import { Controller, Get, Logger, OnModuleInit } from '@nestjs/common'

@Controller()
export class AppController implements OnModuleInit {
  private parsedPackageJson: Record<string, any>
  private readonly logger = new Logger(AppController.name)

  async onModuleInit() {
    this.logger.log('Reading package.json for health endpoint')
    const packageJson = Bun.file(path.resolve(__dirname, '../package.json'))
    this.parsedPackageJson = await packageJson.json() as Record<string, any>
  }

  @Get('/health')
  version() {
    return {
      version: this.parsedPackageJson.version,
    }
  }
}
