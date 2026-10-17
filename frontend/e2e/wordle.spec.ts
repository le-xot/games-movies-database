import { expect, test } from '@playwright/test'
import { ADMIN_STATE_FILE } from './helpers/env'
import type { Locator, Page } from '@playwright/test'

function wordleKey(page: Page, letter: string): Locator {
  return page
    .locator('[aria-label="Клавиатура"] button')
    .filter({ hasText: new RegExp(`^\\s*${letter}\\s*$`) })
}

async function dragToPoint(
  page: Page,
  from: Locator,
  point: { x: number; y: number },
): Promise<void> {
  await from.hover()
  await page.mouse.down()
  await page.mouse.move(point.x, point.y, { steps: 10 })
  await page.mouse.up()
}

async function dragOnto(page: Page, from: Locator, to: Locator): Promise<void> {
  const target = await to.boundingBox()
  if (!target) throw new Error('У цели перетаскивания нет bounding box')
  await dragToPoint(page, from, {
    x: target.x + target.width / 2,
    y: target.y + target.height / 2,
  })
}

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

  test('tapping a player in the stats dialog expands their grid inline', async ({ page }) => {
    await page.goto('/db/wordle')
    await page.getByRole('button', { name: 'Статистика' }).click()
    const dialog = page.getByRole('dialog')

    await dialog.getByRole('button', { name: /e2e-wordle-player/ }).click()

    const grid = dialog.getByRole('img', { name: 'Сетка попыток' })
    await expect(grid).toBeVisible()
    await expect(grid.locator('div')).toHaveCount(6)
    await expect(grid.locator('span')).toHaveCount(30)
  })

  test('physical keyboard drives the board when no input is focused', async ({ page }) => {
    await page.goto('/db/wordle')
    await expect(page.getByRole('grid', { name: 'Игровое поле' })).toBeVisible()

    await page.keyboard.press('KeyT')

    const cells = page.locator('[data-wordle-drop]')
    await expect(cells.nth(0)).toHaveText('е')
  })

  test('dragging a key onto an empty cell places the letter exactly there', async ({ page }) => {
    await page.goto('/db/wordle')

    await wordleKey(page, 'а').click()
    await wordleKey(page, 'б').click()
    await wordleKey(page, 'в').click()

    const cells = page.locator('[data-wordle-drop]')
    await expect(cells).toHaveCount(5)

    await dragOnto(page, wordleKey(page, 'с'), cells.nth(4))

    await expect(cells.nth(0)).toHaveText('а')
    await expect(cells.nth(1)).toHaveText('б')
    await expect(cells.nth(2)).toHaveText('в')
    await expect(cells.nth(3)).toHaveText('')
    await expect(cells.nth(4)).toHaveText('с')

    await wordleKey(page, 'г').click()
    await expect(cells.nth(3)).toHaveText('г')
  })

  test('dragging a key onto an occupied cell replaces the letter', async ({ page }) => {
    await page.goto('/db/wordle')

    await wordleKey(page, 'а').click()
    await wordleKey(page, 'б').click()
    await wordleKey(page, 'в').click()

    const cells = page.locator('[data-wordle-drop]')

    await dragOnto(page, wordleKey(page, 'с'), cells.nth(1))

    await expect(cells.nth(0)).toHaveText('а')
    await expect(cells.nth(1)).toHaveText('с')
    await expect(cells.nth(2)).toHaveText('в')
    await expect(cells.nth(3)).toHaveText('')
  })

  test('dragging a tile onto an empty cell moves it there and leaves a hole', async ({ page }) => {
    await page.goto('/db/wordle')

    await wordleKey(page, 'а').click()

    const cells = page.locator('[data-wordle-drop]')
    await expect(cells.nth(0)).toHaveText('а')

    await dragOnto(page, cells.nth(0), cells.nth(2))

    await expect(cells.nth(0)).toHaveText('')
    await expect(cells.nth(2)).toHaveText('а')
  })

  test('dragging a tile outside the board removes the letter', async ({ page }) => {
    await page.goto('/db/wordle')

    await wordleKey(page, 'а').click()
    await wordleKey(page, 'б').click()

    const cells = page.locator('[data-wordle-drop]')
    await expect(cells.nth(0)).toHaveText('а')

    const board = await page.getByRole('grid', { name: 'Игровое поле' }).boundingBox()
    if (!board) throw new Error('У доски нет bounding box')
    const outside = { x: board.x + board.width / 2, y: board.y - 60 }

    await dragToPoint(page, cells.nth(0), outside)

    await expect(cells.nth(0)).toHaveText('')
    await expect(cells.nth(1)).toHaveText('б')

    await dragToPoint(page, wordleKey(page, 'в'), outside)

    await expect(cells.nth(0)).toHaveText('')
    await expect(cells.nth(1)).toHaveText('б')
  })

  test('dragging a tile inside the board but not onto a cell changes nothing', async ({ page }) => {
    await page.goto('/db/wordle')

    await wordleKey(page, 'а').click()

    const cells = page.locator('[data-wordle-drop]')
    const board = await page.getByRole('grid', { name: 'Игровое поле' }).boundingBox()
    if (!board) throw new Error('У доски нет bounding box')

    await dragToPoint(page, cells.nth(0), {
      x: board.x + board.width / 2,
      y: board.y + board.height - 30,
    })

    await expect(cells.nth(0)).toHaveText('а')
  })

  test('dragging a tile onto an occupied cell swaps the letters', async ({ page }) => {
    await page.goto('/db/wordle')

    await wordleKey(page, 'а').click()
    await wordleKey(page, 'б').click()
    await wordleKey(page, 'в').click()

    const cells = page.locator('[data-wordle-drop]')

    await dragOnto(page, cells.nth(0), cells.nth(2))

    await expect(cells.nth(0)).toHaveText('в')
    await expect(cells.nth(1)).toHaveText('б')
    await expect(cells.nth(2)).toHaveText('а')
  })

  test('practice rounds do not touch daily stats', async ({ page }) => {
    const statsBefore = (await (await page.request.get('/api/wordle/stats')).json()) as {
      played: number
    }

    await page.goto('/db/wordle')
    await page.getByRole('tab', { name: 'Тренировка' }).click()
    await expect(page.locator('[data-wordle-practice]')).toBeVisible()
    await expect(page.getByText('Тренировка не влияет на статистику и серию')).toBeVisible()

    // Сессия в Redis переживает прогоны — принудительно начинаем свежий раунд.
    const attemptButton = page.getByRole('button', { name: /Ещё слово|Другое слово/ })
    await attemptButton.first().click()

    const keyboard = page.locator('[aria-label="Клавиатура"]')
    const dialog = page.getByRole('dialog')

    for (const word of ['кокос', 'ежики', 'птица', 'кокос', 'ежики', 'птица']) {
      for (const letter of word) {
        await wordleKey(page, letter).click()
      }

      // Ждём именно ответ на догадку: иначе на раннем угадывании клик по
      // заблокированной клавиатуре повиснет до таймаута.
      const [response] = await Promise.all([
        page.waitForResponse(
          (res) =>
            res.url().includes('/api/wordle/practice/guess') && res.request().method() === 'POST',
        ),
        keyboard.getByRole('button', { name: 'Ввод' }).click(),
      ])

      const state = (await response.json()) as { status: string }
      if (state.status !== 'IN_PROGRESS') break
    }

    // Вьюпорт этого блока — 1024 < 1280, поэтому диалог результата открывается сам.
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Ещё слово' }).click()
    await expect(page.getByRole('button', { name: 'Другое слово' })).toBeVisible()

    const statsAfter = (await (await page.request.get('/api/wordle/stats')).json()) as {
      played: number
    }
    expect(statsAfter.played).toBe(statsBefore.played)

    await page.getByRole('tab', { name: 'Слово дня' }).click()
    await expect(page.getByRole('grid', { name: 'Игровое поле' })).toBeVisible()
  })
})

test.describe('daily leaderboard preview', () => {
  test.use({
    storageState: ADMIN_STATE_FILE,
    viewport: { width: 1440, height: 900 },
  })

  test('hovering a finished player shows their attempt grid', async ({ page }) => {
    await page.goto('/db/wordle')

    await page.getByRole('button', { name: /e2e-wordle-player/ }).hover()

    const grid = page.getByRole('img', { name: 'Сетка попыток' })
    await expect(grid).toBeVisible()
    await expect(grid.locator('div')).toHaveCount(6)
    await expect(grid.locator('span')).toHaveCount(30)
  })

  test('moving hover to another player keeps the second grid open', async ({ page }) => {
    await page.goto('/db/wordle')

    const first = page.getByRole('button', { name: /e2e-wordle-player не угадал/ })
    const second = page.getByRole('button', { name: /e2e-wordle-rival не угадал/ })

    await first.hover()
    await expect(page.getByRole('img', { name: 'Сетка попыток' })).toBeVisible()

    await second.hover()
    await page.waitForTimeout(500)

    const visibleGrids = page.locator('div[role="img"][aria-label="Сетка попыток"]:visible')
    await expect(visibleGrids).toHaveCount(1)
    await expect(visibleGrids.locator('..')).toContainText('e2e-wordle-rival')
  })
})
