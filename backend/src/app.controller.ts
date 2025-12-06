import path from "node:path"
import { Controller, Get, OnModuleInit } from "@nestjs/common"

@Controller()
export class AppController implements OnModuleInit {
  private parsedPackageJson: Record<string, any>

  async onModuleInit() {
    const packageJson = Bun.file(path.resolve(__dirname, "../package.json"))
    this.parsedPackageJson = await packageJson.json() as Record<string, any>
  }

  @Get("/health")
  version() {
    return {
      version: this.parsedPackageJson.version,
    }
  }
}
