import { describe, expect, it, mock } from 'bun:test'
import { JwtService } from '@nestjs/jwt'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { Test } from '@nestjs/testing'
import { AppController } from '@/app.controller'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { RecordController } from '@/modules/record/record.controller'
import { RecordService } from '@/modules/record/record.service'
import { UserController } from '@/modules/user/user.controller'
import { UserService } from '@/modules/user/user.service'
import { WeatherController } from '@/modules/weather/weather.controller'
import { WeatherService } from '@/modules/weather/weather.service'
import { WordleController } from '@/modules/wordle/wordle.controller'
import { WordleService } from '@/modules/wordle/wordle.service'

const NULLABLE_RECORD_FIELDS = ['status', 'type', 'genre', 'grade', 'episode'] as const

async function buildDocument() {
  const moduleRef = await Test.createTestingModule({
    controllers: [
      AppController,
      UserController,
      RecordController,
      WeatherController,
      WordleController,
    ],
    providers: [
      AuthGuard,
      { provide: JwtService, useValue: { verifyAsync: mock() } },
      { provide: UserService, useValue: {} },
      { provide: RecordService, useValue: {} },
      { provide: WeatherService, useValue: {} },
      { provide: WordleService, useValue: {} },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  return SwaggerModule.createDocument(app, new DocumentBuilder().build())
}

describe('Swagger contract', () => {
  it('marks nullable record columns as nullable', async () => {
    const document = await buildDocument()
    const schemas = document.components?.schemas as
      | Record<string, { properties?: Record<string, { nullable?: boolean }> }>
      | undefined
    const properties = schemas?.RecordEntity?.properties ?? {}

    for (const field of NULLABLE_RECORD_FIELDS) {
      expect(properties[field]?.nullable).toBe(true)
    }
  })

  it('types response schemas for the reviewed endpoints', async () => {
    const document = await buildDocument()
    const paths = document.paths as Record<
      string,
      Record<
        string,
        { responses?: Record<string, { content?: Record<string, { schema?: unknown }> }> }
      >
    >
    const okSchema = (path: string, method: string) =>
      paths[path]?.[method]?.responses?.['200']?.content?.['application/json']?.schema

    expect(okSchema('/users/{id}', 'get')).toEqual({ $ref: '#/components/schemas/UserEntity' })
    expect(okSchema('/users/{id}/accounts', 'get')).toMatchObject({
      type: 'array',
      items: { $ref: '#/components/schemas/UserAccountEntity' },
    })
    expect(okSchema('/weather', 'get')).toEqual({ $ref: '#/components/schemas/WeatherDTO' })
  })

  it('declares ApiErrorDto for controller error responses', async () => {
    const document = await buildDocument()
    const paths = document.paths as Record<
      string,
      Record<
        string,
        { responses?: Record<string, { content?: Record<string, { schema?: unknown }> }> }
      >
    >
    const schema =
      paths['/users/{id}']?.get?.responses?.['401']?.content?.['application/json']?.schema

    expect(schema).toEqual({ $ref: '#/components/schemas/ApiErrorDto' })
  })

  it('types the record 404 response with ApiErrorDto', async () => {
    const document = await buildDocument()
    const paths = document.paths as Record<
      string,
      Record<
        string,
        { responses?: Record<string, { content?: Record<string, { schema?: unknown }> }> }
      >
    >
    const schema =
      paths['/records/{id}']?.get?.responses?.['404']?.content?.['application/json']?.schema

    expect(schema).toEqual({ $ref: '#/components/schemas/ApiErrorDto' })
  })

  it('does not advertise auth errors on the public wordle leaderboard', async () => {
    const document = await buildDocument()
    const paths = document.paths as Record<string, Record<string, { responses?: object }>>

    const responseStatuses = Object.keys(paths['/wordle/leaderboard']?.get?.responses ?? {})

    expect(responseStatuses).toContain('200')
    expect(responseStatuses).not.toContain('401')
    expect(responseStatuses).not.toContain('403')
  })

  it('keeps auth errors on protected wordle routes', async () => {
    const document = await buildDocument()
    const paths = document.paths as Record<string, Record<string, { responses?: object }>>

    const responseStatuses = Object.keys(paths['/wordle/state']?.get?.responses ?? {})

    expect(responseStatuses).toContain('401')
    expect(responseStatuses).toContain('403')
  })

  it('does not advertise auth errors on public endpoints', async () => {
    const document = await buildDocument()
    const paths = document.paths as Record<string, Record<string, { responses?: object }>>

    for (const path of ['/health', '/weather']) {
      const responseStatuses = Object.keys(paths[path]?.get?.responses ?? {})
      expect(responseStatuses).toContain('200')
      expect(responseStatuses).not.toContain('401')
      expect(responseStatuses).not.toContain('403')
    }
  })
})
