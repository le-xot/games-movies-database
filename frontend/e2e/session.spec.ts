import { expect, test } from '@playwright/test'
import { ADMIN_STATE_FILE } from './helpers/env'

test.describe('admin session', () => {
  test.use({ storageState: ADMIN_STATE_FILE })

  test('seeded admin is authenticated via the JWT cookie', async ({ page }) => {
    await page.goto('/db/games')
    await expect(page.getByText('e2e-admin').first()).toBeVisible()
  })
})
