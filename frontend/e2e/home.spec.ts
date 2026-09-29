import { expect, test } from '@playwright/test'

test('home page shows the banner and database card', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByAltText('Main Banner')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Кладовка' })).toHaveAttribute(
    'href',
    '/db/suggestion',
  )
})

test('weather widget is hidden when the API fails', async ({ page }) => {
  await page.route(/\/api\/weather(\?.*)?$/, (route) => route.abort())
  await page.goto('/')
  await expect(page.getByAltText('Main Banner')).toBeVisible()
  await expect(page.getByTestId('weather-badge')).toBeHidden()
})
