import { useQuery } from '@pinia/colada'
import { computed, onScopeDispose, ref, toValue, watch } from 'vue'
import { COCKTAIL_MATCH_KEY, COCKTAIL_SEARCH_KEY } from '@/composables/query-keys'
import { unwrap } from '@/lib/api'
import { useApi } from '@/stores/use-api'
import type { MatchedCocktail } from '@/pages/cocktails/types'
import type { MaybeRefOrGetter } from 'vue'

/**
 * Матчинг всегда запрашивается с максимальным порогом: слайдер фильтрует уже
 * полученный список на клиенте, поэтому не порождает запросов.
 */
export const MATCH_MAX_MISSING = 3

/**
 * Порог для поиска: он идёт по всему справочнику и не должен зависеть от
 * фильтра «докупать до». 50 — верхняя граница схемы гейтвея.
 */
export const SEARCH_MAX_MISSING = 50

/** Пауза перед запросом: пока пользователь щёлкает галочки или печатает, сеть отдыхает. */
export const MATCH_DEBOUNCE_MS = 200

interface UseCocktailMatchOptions {
  enabled?: MaybeRefOrGetter<boolean>
  /** Текст поиска: непустой включает отдельную выдачу по всему справочнику. */
  searchQuery?: MaybeRefOrGetter<string>
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
 *
 * Поиск — второй, независимый запрос с `maxMissing: 50`: фильтры докупки его не
 * сужают, поэтому найденный коктейль видно, даже если его сейчас не собрать.
 * Ключ включает текст запроса, а пустой текст выключает запрос целиком.
 */
export function useCocktailMatch(
  ingredientIds: MaybeRefOrGetter<string[]>,
  options: UseCocktailMatchOptions = {},
) {
  const api = useApi()
  const requestIds = ref(normalizeIds(toValue(ingredientIds)))
  const submittedSearch = ref(toValue(options.searchQuery ?? '').trim())

  let idsTimer: ReturnType<typeof setTimeout> | null = null
  let searchTimer: ReturnType<typeof setTimeout> | null = null

  watch(
    () => normalizeIds(toValue(ingredientIds)),
    (next) => {
      if (idsTimer !== null) clearTimeout(idsTimer)
      idsTimer = setTimeout(() => {
        idsTimer = null
        requestIds.value = next
      }, MATCH_DEBOUNCE_MS)
    },
  )

  watch(
    () => toValue(options.searchQuery ?? '').trim(),
    (next) => {
      if (searchTimer !== null) clearTimeout(searchTimer)

      // Очистка поля возвращает обычную выдачу сразу: ждать дебаунс незачем,
      // а выключенный запрос не должен уйти в сеть.
      if (next === '') {
        searchTimer = null
        submittedSearch.value = ''
        return
      }

      searchTimer = setTimeout(() => {
        searchTimer = null
        submittedSearch.value = next
      }, MATCH_DEBOUNCE_MS)
    },
  )

  onScopeDispose(() => {
    if (idsTimer !== null) clearTimeout(idsTimer)
    if (searchTimer !== null) clearTimeout(searchTimer)
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

  const {
    data: searchData,
    isLoading: isSearchLoading,
    error: searchError,
    refetch: refetchSearch,
  } = useQuery<MatchedCocktail[]>({
    key: () => [COCKTAIL_SEARCH_KEY, requestIds.value.join(','), submittedSearch.value],
    query: () =>
      unwrap(
        api.cocktails.match.post({
          ingredientIds: requestIds.value,
          maxMissing: SEARCH_MAX_MISSING,
        }),
      ),
    // Поиск работает и с пустым баром: справочник целиком, все строки отсутствуют.
    enabled: () => submittedSearch.value !== '',
    placeholderData: (previous) => previous,
  })

  const searchCocktails = computed(() => searchData.value ?? [])
  const isSearchInitialLoading = computed(
    () => isSearchLoading.value && searchData.value === undefined,
  )

  return {
    cocktails,
    isLoading,
    isInitialLoading,
    error,
    refetch,
    /** Текст, по которому уже запрошена выдача (с дебаунсом). */
    submittedSearch,
    searchCocktails,
    isSearchLoading,
    isSearchInitialLoading,
    searchError,
    refetchSearch,
  }
}
