/**
 * Приводит повторяющиеся query-параметры к массиву до валидации схемы.
 *
 * Elysia по умолчанию оставляет последнее значение (`?status=A&status=B` → `"B"`),
 * а фронт шлёт именно повторяющиеся ключи: `openapi-fetch` сериализует массивы
 * как `style: form, explode: true`. Без этого фильтр по двум статусам молча
 * схлопнулся бы в один.
 *
 * Вызывается из `onTransform`: он выполняется после парсинга, но до проверки
 * схемы, поэтому `t.Array(...)` уже получает массив.
 */
export function collectArrayQuery(
  request: Request,
  query: Record<string, unknown>,
  keys: readonly string[],
): void {
  const searchParams = new URL(request.url).searchParams

  for (const key of keys) {
    const values = searchParams.getAll(key)
    if (values.length === 0) continue

    query[key] = values
  }
}

/**
 * Приводит числовые query-параметры к числу.
 *
 * Нужно из-за комбинации `t.Ref` и чисел в одной схеме: если в query-схеме есть
 * ссылка на модель, Elysia перестаёт приводить строки к числам, и `limit=5`
 * прилетает строкой, падая на `t.Number()`. Проверка схемы идёт после
 * `onTransform`, поэтому конвертируем там.
 */
export function coerceQueryNumbers(
  _request: Request,
  query: Record<string, unknown>,
  keys: readonly string[],
): void {
  for (const key of keys) {
    const value = query[key]
    if (typeof value !== 'string' || value.trim() === '') continue

    const parsed = Number(value)
    if (Number.isFinite(parsed)) query[key] = parsed
  }
}
