import type { MatchedCocktail } from './cocktail.types'

export const OPEN_SITE_BUTTON_TEXT = 'Открыть сайт'

/** Длиннее десяти позиций сообщение в Telegram уже не читается — остаток схлопываем. */
export const MAX_BAR_RESULTS = 10

export function buildConnectRequiredText(): string {
  return 'Чтобы показать коктейли из твоего бара, войди на сайт через Telegram — и отправь /bar ещё раз.'
}

export function buildEmptyBarText(): string {
  return 'Твой бар пустой: отметь на сайте, что у тебя есть, и отправь /bar снова.'
}

export function buildFormatHintText(): string {
  return 'Формат: /bar — только из того, что есть; /bar 1, /bar 2 или /bar 3 — сколько ингредиентов готов докупить.'
}

function pluralizeIngredients(count: number): string {
  return count === 1 ? 'ингредиента' : 'ингредиентов'
}

export function buildNoMatchesText(maxMissing: number): string {
  if (maxMissing === 0) {
    return 'Из твоего бара пока ничего не собрать. Попробуй /bar 1 — покажу, что почти готово.'
  }

  return `Даже с докупкой до ${maxMissing} ${pluralizeIngredients(maxMissing)} ничего не нашлось.`
}

function buildHeader(maxMissing: number): string {
  if (maxMissing === 0) return 'Из твоего бара можно собрать:'

  return `Из твоего бара — с докупкой до ${maxMissing} ${pluralizeIngredients(maxMissing)}:`
}

function buildCocktailLine(cocktail: MatchedCocktail): string {
  const lines = [`• ${cocktail.name}`]

  if (cocktail.missingCore.length > 0) {
    lines.push(`  докупить: ${cocktail.missingCore.join(', ')}`)
  }
  if (cocktail.missingExtra.length > 0) {
    // Названия ингредиентов не склоняем: список после двоеточия читается
    // ровно так же, а «без Ангостуры» требовало бы словаря падежей.
    lines.push(`  без: ${cocktail.missingExtra.join(', ')} — будет хуже`)
  }

  return lines.join('\n')
}

export function buildBarMessage(results: readonly MatchedCocktail[], maxMissing: number): string {
  if (results.length === 0) return buildNoMatchesText(maxMissing)

  const shown = results.slice(0, MAX_BAR_RESULTS)
  const rest = results.length - shown.length
  const lines = [buildHeader(maxMissing), '', ...shown.map(buildCocktailLine)]

  if (rest > 0) {
    lines.push('', `и ещё ${rest} — полный список на сайте.`)
  }

  return lines.join('\n')
}
