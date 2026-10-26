import { expect, test } from '@playwright/test'
import { ADMIN_STATE_FILE } from './helpers/env'

test.use({ storageState: ADMIN_STATE_FILE })

async function openAccountDialog(page: import('@playwright/test').Page) {
  await page.goto('/db/games')
  await page.getByText('e2e-admin').first().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'Аккаунт' })).toBeVisible()

  return dialog
}

test('avatar frame survives a reload', async ({ page }) => {
  const dialog = await openAccountDialog(page)

  await dialog.getByTestId('frame-admin').click()
  await expect(dialog.getByTestId('frame-admin')).toHaveAttribute('aria-pressed', 'true')
  await expect(dialog.getByTestId('account-avatar')).toHaveAttribute('data-frame', 'admin')

  const reloaded = await openAccountDialog(page)

  await expect(reloaded.getByTestId('frame-admin')).toHaveAttribute('aria-pressed', 'true')
  await expect(reloaded.getByTestId('account-avatar')).toHaveAttribute('data-frame', 'admin')
})

test('checkpoint frames that are not earned stay locked', async ({ page }) => {
  const dialog = await openAccountDialog(page)

  // Админ заработал только красную рамку: серии и сотни оценок у него нет.
  await expect(dialog.getByTestId('frame-wordle-streak')).toBeDisabled()
  await expect(dialog.getByTestId('frame-ratings-100')).toBeDisabled()
  await expect(dialog.getByTestId('frame-admin')).toBeEnabled()
})

test('the frame can be reset to none', async ({ page }) => {
  const dialog = await openAccountDialog(page)

  await dialog.getByTestId('frame-none').click()
  await expect(dialog.getByTestId('frame-none')).toHaveAttribute('aria-pressed', 'true')
  await expect(dialog.getByTestId('account-avatar')).not.toHaveAttribute('data-frame', 'admin')
})
