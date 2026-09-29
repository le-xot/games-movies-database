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

test('weather widget renders when the API succeeds', async ({ page }) => {
  await page.route(/\/api\/weather(\?.*)?$/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        name: 'Уфа',
        main: { temp: 5, feels_like: 3, humidity: 80, pressure: 1010 },
        weather: [{ main: 'Clear', description: 'ясно' }],
        wind: { speed: 4 },
        clouds: { all: 10 },
        visibility: 10000,
        sys: { sunrise: 1_700_000_000, sunset: 1_700_010_000 },
      }),
    }),
  )
  await page.goto('/')
  await expect(page.getByTestId('weather-badge')).toBeVisible()
  await expect(page.getByTestId('weather-badge')).toContainText('Уфа')
})
