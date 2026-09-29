import { expect, test } from '@playwright/test'

test('login dialog opens with all providers', async ({ page }) => {
  await page.goto('/db/games')
  await page.getByRole('button', { name: 'Войти' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('Вход')).toBeVisible()
  for (const provider of ['Twitch', 'Kick', 'Telegram']) {
    await expect(dialog.getByRole('button', { name: provider })).toBeVisible()
  }
})

test('twitch login navigates to the backend OAuth entrypoint', async ({ page }) => {
  await page.goto('/db/games')
  await page.getByRole('button', { name: 'Войти' }).click()
  await page.route('**/api/auth/twitch', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<html><body>oauth-stub</body></html>',
    }),
  )
  await page.getByRole('dialog').getByRole('button', { name: 'Twitch' }).click()
  await expect(page).toHaveURL(/\/api\/auth\/twitch$/)
  await expect(page.getByText('oauth-stub')).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('loginReturnUrl'))).toBe('/db/games')
})

test('oauth callback shows the error from the query string', async ({ page }) => {
  await page.goto('/auth/callback/twitch?error=access_denied')
  await expect(page.getByText('access_denied')).toBeVisible()
})
