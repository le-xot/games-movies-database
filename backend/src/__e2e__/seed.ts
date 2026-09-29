import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { records, users } from '@gmd/database/schema'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { SignJWT } from 'jose'
import { Pool } from 'pg'

const ADMIN_ID = 'e2e-admin'
const VICTIM_ID = 'e2e-victim'
const RECORD_LINK = 'https://example.com/e2e-record'
const RECORD_TITLE = 'E2E Record'

const datasourceUrl = process.env.TEST_DATASOURCE_URL ?? process.env.DATASOURCE_URL
const jwtSecret = process.env.JWT_SECRET
const stateFile = process.env.E2E_STATE_FILE

if (!datasourceUrl || !jwtSecret || !stateFile) {
  console.error('Seed требует DATASOURCE_URL/TEST_DATASOURCE_URL, JWT_SECRET и E2E_STATE_FILE')
  process.exit(1)
}

const pool = new Pool({ connectionString: datasourceUrl })
const db = drizzle(pool)

try {
  for (const [id, login, role] of [
    [ADMIN_ID, 'e2e-admin', 'ADMIN'],
    [VICTIM_ID, 'e2e-victim', 'USER'],
  ] as const) {
    await db
      .insert(users)
      .values({ id, login, role, profileImageUrl: '', color: '#333333' })
      .onConflictDoUpdate({
        target: users.id,
        set: { login, role, profileImageUrl: '', hasCustomAvatar: false },
      })
  }

  await db.delete(records).where(eq(records.link, RECORD_LINK))
  await db.insert(records).values({
    title: RECORD_TITLE,
    link: RECORD_LINK,
    posterUrl: '',
    genre: 'GAME',
    status: 'QUEUE',
    type: 'WRITTEN',
  })

  const token = await new SignJWT({ id: ADMIN_ID })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(new TextEncoder().encode(jwtSecret))

  fs.mkdirSync(path.dirname(stateFile), { recursive: true })
  fs.writeFileSync(
    stateFile,
    JSON.stringify({
      cookies: [
        {
          name: 'token',
          value: token,
          domain: 'localhost',
          path: '/',
          expires: -1,
          httpOnly: true,
          secure: false,
          sameSite: 'Lax',
        },
      ],
      origins: [],
    }),
  )
  console.log(`✅ E2E seed: ${ADMIN_ID}, ${VICTIM_ID}, запись «${RECORD_TITLE}»`)
} finally {
  await pool.end()
}
