import { expect, test } from '@playwright/test'
import { ADMIN_STATE_FILE } from './helpers/env'

// Seed выполняется один раз за прогон: ретрай после удаления записи не восстановит её.
test.describe.configure({ retries: 0 })

test.use({ storageState: ADMIN_STATE_FILE })

test('admin updates status and deletes the seeded record', async ({ page }) => {
  await page.goto('/db/games')
  const card = page.getByTestId('record-card').filter({ hasText: 'E2E Record' })
  await expect(card).toBeVisible()

  const patchResponse = page.waitForResponse(
    (response) =>
      response.request().method() === 'PATCH' && response.url().includes('/api/records'),
  )
  await card.getByText('В очереди').click()
  await page.getByRole('button', { name: 'В процессе' }).click()
  expect((await patchResponse).ok()).toBe(true)

  // Источник истины — перезагрузка: локальная мутация обновляет список через WS-рефетч.
  await page.reload()
  const reloaded = page.getByTestId('record-card').filter({ hasText: 'E2E Record' })
  await expect(reloaded.getByText('В процессе')).toBeVisible()

  await reloaded.getByTestId('record-action-delete').click()
  await expect(page.getByRole('alertdialog').getByText('Удалить игру?')).toBeVisible()
  await page.getByRole('button', { name: 'Подтвердить' }).click()
  // Карточка исчезает без перезагрузки — список обновляет WS-событие update-records
  // (у мутации нет локальной инвалидации), так что это ещё и сквозная проверка сокета.
  await expect(page.getByText('E2E Record')).toBeHidden()
  await expect(page.getByPlaceholder('Искать по названию')).toBeVisible()
})
