import { expect, test } from '@playwright/test'
import { ADMIN_STATE_FILE } from './helpers/env'

// Seed выполняется один раз за прогон: ретрай после удаления фикстуры не восстановит её.
test.describe.configure({ retries: 0 })

test.use({ storageState: ADMIN_STATE_FILE })

test('admin page lists users and deletes the seeded victim', async ({ page }) => {
  await page.goto('/db/admin')
  await expect(page.getByRole('heading', { name: 'Админка' })).toBeVisible()
  const victim = page.getByTestId('user-card').filter({ hasText: 'e2e-victim' })
  await expect(victim).toBeVisible()
  await victim.getByTestId('user-delete').click()
  await expect(page.getByRole('alertdialog').getByText('Удалить пользователя?')).toBeVisible()
  await page.getByRole('button', { name: 'Подтвердить' }).click()
  await expect(page.getByTestId('user-card').filter({ hasText: 'e2e-victim' })).toBeHidden()
  await expect(page.getByTestId('user-card').filter({ hasText: 'e2e-admin' })).toBeVisible()
})

test('account dialog opens and navigates to the admin page', async ({ page }) => {
  await page.goto('/db/games')
  await page.getByText('e2e-admin').first().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'Аккаунт' })).toBeVisible()
  await expect(dialog.getByText('Админ', { exact: true }).first()).toBeVisible()
  await dialog.getByRole('button', { name: 'Админка' }).click()
  await expect(page).toHaveURL(/\/db\/admin$/)
})

test('logout returns to the guest state', async ({ page }) => {
  await page.goto('/db/games')
  await page.getByText('e2e-admin').first().click()
  await page.getByRole('button', { name: 'Выйти' }).click()
  await expect(page.getByRole('button', { name: 'Войти' })).toBeVisible()
})
