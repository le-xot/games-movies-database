import { Logger, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'
import cookieParser from 'cookie-parser'
import { AppModule } from '@/app.module'
import { env } from '@/utils/enviroments'
import type { NestExpressApplication } from '@nestjs/platform-express'

async function bootstrap() {
  const logger = new Logger('Bootstrap')
  logger.log('🚀 Starting application bootstrap')
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'warn', 'error'],
  })
  app.set('trust proxy', 1)
  app.use(cookieParser())

  const globalPrefix = '/api'

  if (env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder().setTitle('games-movies-database').build()
    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('docs', app, document)

    const updatedDocument = {
      ...document,
      paths: Object.fromEntries(
        Object.entries(document.paths).map(([path, value]) => [`${globalPrefix}${path}`, value]),
      ),
    }

    app.use(
      '/reference',
      apiReference({
        content: updatedDocument,
      }),
    )
  }

  app.setGlobalPrefix(globalPrefix)

  const allowedCors = ['http://localhost:3000', 'http://localhost:5173']

  app.enableCors({
    origin: allowedCors,
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
