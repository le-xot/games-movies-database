import { Logger, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import cookieParser from 'cookie-parser'
import { AppModule } from '@/app.module'
import { parseCorsOrigins } from '@/utils/cors-origins'
import { env } from '@/utils/enviroments'
import { securityHeaders } from '@/utils/security-headers'
import type { NestExpressApplication } from '@nestjs/platform-express'

async function bootstrap() {
  const logger = new Logger('Bootstrap')
  logger.log('🚀 Starting application bootstrap')
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'warn', 'error'],
  })
  // Явно только SIGTERM/SIGINT: enableShutdownHooks() без аргументов подписывается
  // на все сигналы, включая SIGSEGV/SIGBUS — в Bun это подавляет падение процесса,
  // и вместо рестарта контейнер зависает на graceful teardown.
  app.enableShutdownHooks(['SIGTERM', 'SIGINT'])
  app.set('trust proxy', 1)
  app.use(cookieParser())
  app.use(securityHeaders)

  const globalPrefix = '/api'

  app.setGlobalPrefix(globalPrefix)

  app.enableCors({
    origin: parseCorsOrigins(env.CORS_ORIGINS),
    credentials: true,
  })

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  )
  await app.listen(env.APP_PORT, '0.0.0.0')
  logger.log(`✅ Application is listening on port ${env.APP_PORT}`)
}

bootstrap()
