import process from "node:process"
import { INestApplication, Injectable, OnModuleInit } from "@nestjs/common"
import { PrismaClient } from "@prisma/client"

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  public async onModuleInit() {
    await this.$connect()
  }

  public enableShutdownHooks(app: INestApplication) {
    process.on("beforeExit", async () => {
      await app.close()
    })
  }
}
