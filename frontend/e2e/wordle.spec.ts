import { expect, test } from '@playwright/test'
import { ADMIN_STATE_FILE } from './helpers/env'

test('guest sees the placeholder and the leaderboard', async ({ page }) => {
  await page.goto('/db/wordle')
  await expect(page.getByRole('heading', { name: 'Вордли' })).toBeVisible()
  await expect(page.getByText('Угадайте слово дня и попадите в таблицу лидеров')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Войдите в аккаунт, чтобы сыграть в Вордли' }),
  ).toBeVisible()
  await expect(page.getByText('Лидеры').first()).toBeVisible()
  await expect(page.getByText('Сегодня').first()).toBeVisible()
})

test.describe('authorized player', () => {
  test.use({
    storageState: ADMIN_STATE_FILE,
    viewport: { width: 1024, height: 900 },
  })

  test('board and stats dialog render for an authorized player', async ({ page }) => {
    await page.goto('/db/wordle')
    await expect(page.getByRole('grid', { name: 'Игровое поле' })).toBeVisible()
    await expect(page.locator('[aria-label="Клавиатура"]')).toBeVisible()
    await page.getByRole('button', { name: 'Статистика' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'Статистика' })).toBeVisible()
    await expect(dialog.getByText('Играно')).toBeVisible()
  })
})
