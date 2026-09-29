import { expect, test } from '@playwright/test'
import { BACKEND_PORT, FRONTEND_PORT } from './helpers/env'

test('frontend dev server is served on the E2E port', async ({ page }) => {
  await page.goto('/')
  expect(page.url()).toContain(`:${FRONTEND_PORT}`)
  await expect(page.getByAltText('Main Banner')).toBeVisible()
})

test('backend health endpoint answers on the E2E port', async ({ request }) => {
  const response = await request.get(`http://localhost:${BACKEND_PORT}/api/health`)
  expect(response.ok()).toBe(true)
  await expect(response.json()).resolves.toEqual({ status: 'ok' })
})
