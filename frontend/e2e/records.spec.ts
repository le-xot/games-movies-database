import { expect, test } from '@playwright/test'
import { ADMIN_STATE_FILE } from './helpers/env'

test.use({ storageState: ADMIN_STATE_FILE })

test('admin updates status and deletes the seeded record', async ({ page }) => {
  await page.goto('/db/games')
  const card = page.getByTestId('record-card').filter({ hasText: 'E2E Record' })
  await expect(card).toBeVisible()

  await card.getByText('В очереди').click()
  await page.getByRole('button', { name: 'В процессе' }).click()

  // Источник истины — перезагрузка: локальная мутация обновляет список через WS-рефетч.
  await page.reload()
  const reloaded = page.getByTestId('record-card').filter({ hasText: 'E2E Record' })
  await expect(reloaded.getByText('В процессе')).toBeVisible()

  await reloaded.getByTestId('record-action-delete').click()
  await expect(page.getByRole('alertdialog').getByText('Удалить игру?')).toBeVisible()
  await page.getByRole('button', { name: 'Подтвердить' }).click()
  await expect(page.getByText('E2E Record')).toBeHidden()
})
