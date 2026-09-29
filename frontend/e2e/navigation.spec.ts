import { expect, test } from '@playwright/test'

const sections: Array<[string, string]> = [
  ['Советы', '/db/suggestion'],
  ['Игры', '/db/games'],
  ['Аниме', '/db/anime'],
  ['Фильмы', '/db/movie'],
  ['Сериалы', '/db/series'],
  ['Мультфильмы', '/db/cartoon'],
  ['Статистика', '/db/stats'],
  ['Вордли', '/db/wordle'],
]

test('sidebar navigates across all database sections', async ({ page }) => {
  await page.goto('/db/suggestion')
  for (const [label, path] of sections) {
    await page.getByRole('link', { name: label, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`${path}$`))
  }
})

test('home link returns to the landing page', async ({ page }) => {
  await page.goto('/db/stats')
  await page.getByRole('link', { name: 'На главную' }).click()
  await expect(page).toHaveURL(/\/$/)
})

test('unknown routes redirect to home', async ({ page }) => {
  await page.goto('/definitely-missing')
  await expect(page).toHaveURL(/\/$/)
})

test('admin route redirects guests to home', async ({ page }) => {
  await page.goto('/db/admin')
  await expect(page).toHaveURL(/\/$/)
})
