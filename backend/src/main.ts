import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'
import cookieParser from 'cookie-parser'
import { AppModule } from './app.module'
import { env } from './utils/enviroments'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error'],
  })
  app.use(cookieParser())
  app.enableCors()
  const config = new DocumentBuilder().setTitle('games-movies-database').build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document)

  const globalPrefix = '/api'

  app.setGlobalPrefix(globalPrefix)

  const updatedDocument = {
    ...document,
    paths: Object.fromEntries(
      Object.entries(document.paths).map(([path, value]) => [
        `${globalPrefix}${path}`,
        value,
      ]),
    ),
  }

  if (env) {
    app.use(
      '/reference',
      apiReference({
        spec: {
          content: updatedDocument,
        },
      }),
    )
  }

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
}

bootstrap()
