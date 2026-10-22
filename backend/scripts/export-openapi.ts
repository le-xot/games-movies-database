import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

/**
 * Собирает OpenAPI-документ из декораторов Nest в frontend/openapi.json.
 *
 * HTTP-сервер не поднимается, поэтому БД, Redis и настоящие секреты не нужны —
 * переменные окружения ниже фиктивные и ставятся до импорта AppModule, где их
 * проверяет envalid. Nest вызывает onModuleInit только на app.init(), так что
 * подключения к базе не происходит.
 */
process.env.NODE_ENV = 'development'
process.env.DATASOURCE_URL ??= 'postgresql://openapi:openapi@127.0.0.1:5432/openapi'
process.env.JWT_SECRET ??= 'openapi-export'
process.env.TWITCH_CALLBACK_URL ??= 'http://localhost:3000/api/auth/twitch/callback'

const { NestFactory } = await import('@nestjs/core')
const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger')
const { AppModule } = await import('@/app.module')

const OUTPUT = join(import.meta.dir, '..', '..', 'frontend', 'openapi.json')

const app = await NestFactory.create(AppModule, { logger: false })
const config = new DocumentBuilder().setTitle('games-movies-database').build()
const document = SwaggerModule.createDocument(app, config)

writeFileSync(OUTPUT, `${JSON.stringify(document, null, 2)}\n`)

console.log(`✅ OpenAPI: ${Object.keys(document.paths).length} путей → frontend/openapi.json`)
process.exit(0)
