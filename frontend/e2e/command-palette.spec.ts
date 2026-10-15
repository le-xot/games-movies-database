import { expect, test } from '@playwright/test'
import { ADMIN_STATE_FILE } from './helpers/env'

test('Ctrl+K opens the palette and filters records', async ({ page }) => {
  await page.goto('/db/games')

  await page.keyboard.press('Control+k')

  const input = page.getByTestId('palette-input')
  await expect(input).toBeVisible()

  await input.fill('E2E')

  const record = page.getByTestId('palette-record')
  await expect(record).toHaveCount(1)
  await expect(record).toContainText('E2E Record')
  await expect(record).toContainText('🔥')
})

test('Enter opens the selected record in a new tab and closes the palette', async ({ page }) => {
  await page.goto('/db/games')

  await page.keyboard.press('Control+k')
  const input = page.getByTestId('palette-input')
  await input.fill('E2E')
  await expect(page.getByTestId('palette-record')).toHaveCount(1)

  const [popup] = await Promise.all([page.waitForEvent('popup'), page.keyboard.press('Enter')])

  expect(popup.url()).toBe('https://example.com/e2e-record')
  await expect(input).toBeHidden()
})

test('Enter on a page command navigates and closes the palette', async ({ page }) => {
  await page.goto('/db/games')

  await page.keyboard.press('Control+k')
  const input = page.getByTestId('palette-input')
  await input.fill('Статистика')

  await expect(page.getByTestId('palette-command')).toHaveCount(1)
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL(/\/db\/stats$/)
  await expect(input).toBeHidden()
})

test('arrow keys move the active item', async ({ page }) => {
  await page.goto('/db/games')

  await page.keyboard.press('Control+k')
  const commands = page.getByTestId('palette-command')

  await expect(commands.nth(0)).toHaveAttribute('data-active', 'true')

  await page.keyboard.press('ArrowDown')

  await expect(commands.nth(0)).toHaveAttribute('data-active', 'false')
  await expect(commands.nth(1)).toHaveAttribute('data-active', 'true')
})

test('opens with the hotkey on a non-Latin keyboard layout', async ({ page }) => {
  await page.goto('/db/games')

  await page.evaluate(() => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'к', code: 'KeyK', ctrlKey: true, bubbles: true }),
    )
  })

  await expect(page.getByTestId('palette-input')).toBeVisible()
})

test('sidebar trigger opens the palette', async ({ page }) => {
  await page.goto('/db/stats')

  await page.getByTestId('palette-trigger').click()

  await expect(page.getByTestId('palette-input')).toBeVisible()
})

test('mobile header exposes the palette trigger', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/db/stats')

  await page.getByTestId('palette-trigger-mobile').click()

  await expect(page.getByTestId('palette-input')).toBeVisible()
})

test.describe('on the wordle page', () => {
  test.use({ storageState: ADMIN_STATE_FILE })

  test('typing and deleting works in the palette input', async ({ page }) => {
    await page.goto('/db/wordle')
    await expect(page.getByRole('grid', { name: 'Игровое поле' })).toBeVisible()

    await page.keyboard.press('Control+k')
    const input = page.getByTestId('palette-input')

    await input.pressSequentially('тест')
    await expect(input).toHaveValue('тест')

    await input.press('Backspace')

    await expect(input).toHaveValue('тес')
  })
})
