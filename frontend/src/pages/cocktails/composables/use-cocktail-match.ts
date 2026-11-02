import { useQuery } from '@pinia/colada'
import { computed, onScopeDispose, ref, toValue, watch } from 'vue'
import { COCKTAIL_MATCH_KEY } from '@/composables/query-keys'
import { unwrap } from '@/lib/api'
import { useApi } from '@/stores/use-api'
import type { MatchedCocktail } from '@/pages/cocktails/types'
import type { MaybeRefOrGetter } from 'vue'

/**
 * Матчинг всегда запрашивается с максимальным порогом: слайдер фильтрует уже
 * полученный список на клиенте, поэтому не порождает запросов.
 */
export const MATCH_MAX_MISSING = 3

/** Пауза перед запросом: пока пользователь щёлкает галочки, сеть отдыхает. */
export const MATCH_DEBOUNCE_MS = 200

interface UseCocktailMatchOptions {
  enabled?: MaybeRefOrGetter<boolean>
}

function normalizeIds(ids: readonly string[]): string[] {
  return [...new Set(ids)].sort()
}

/**
 * Выдача коктейлей под текущий набор.
 *
 * Ключ запроса включает отсортированный набор, так что одинаковый бар, собранный
 * в разном порядке, попадает в тот же кэш. При ошибке остаётся предыдущая
 * выдача — пустой экран вместо результата выглядел бы как потеря данных.
 */
export function useCocktailMatch(
  ingredientIds: MaybeRefOrGetter<string[]>,
  options: UseCocktailMatchOptions = {},
) {
  const api = useApi()
  const requestIds = ref(normalizeIds(toValue(ingredientIds)))

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  watch(
    () => normalizeIds(toValue(ingredientIds)),
    (next) => {
      if (debounceTimer !== null) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        debounceTimer = null
        requestIds.value = next
      }, MATCH_DEBOUNCE_MS)
    },
  )

  onScopeDispose(() => {
    if (debounceTimer !== null) clearTimeout(debounceTimer)
  })

  const { data, isLoading, error, refetch } = useQuery<MatchedCocktail[]>({
    key: () => [COCKTAIL_MATCH_KEY, requestIds.value.join(',')],
    query: () =>
      unwrap(
        api.cocktails.match.post({
          ingredientIds: requestIds.value,
          maxMissing: MATCH_MAX_MISSING,
        }),
      ),
    enabled: () => toValue(options.enabled ?? true) && requestIds.value.length > 0,
    placeholderData: (previous) => previous,
  })

  /** Последняя удачная выдача: держим её, если следующий запрос упал. */
  const lastResult = ref<MatchedCocktail[]>([])
  watch(data, (value) => {
    if (value) lastResult.value = value
  })

  const cocktails = computed(() => data.value ?? lastResult.value)
  const isInitialLoading = computed(() => isLoading.value && data.value === undefined)

  return {
    cocktails,
    isLoading,
    isInitialLoading,
    error,
    refetch,
  }
}
