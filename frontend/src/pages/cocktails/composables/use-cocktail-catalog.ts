import { useQuery } from '@pinia/colada'
import { computed } from 'vue'
import { COCKTAIL_CATALOG_KEY } from '@/composables/query-keys'
import { unwrap } from '@/lib/api'
import { useApi } from '@/stores/use-api'
import type { CocktailCatalog } from '@/pages/cocktails/types'

/** Справочник ингредиентов по полкам: грузится один раз и живёт в кэше. */
export function useCocktailCatalog() {
  const api = useApi()

  const { data, isLoading, error, refetch } = useQuery<CocktailCatalog>({
    key: [COCKTAIL_CATALOG_KEY],
    query: () => unwrap(api.cocktails.catalog.get()),
    gcTime: false,
  })

  const shelves = computed(() => data.value?.shelves ?? [])
  const isInitialLoading = computed(() => isLoading.value && data.value === undefined)
  const ingredientCount = computed(() =>
    shelves.value.reduce((sum, shelf) => sum + shelf.ingredients.length, 0),
  )

  return { shelves, isLoading, isInitialLoading, error, refetch, ingredientCount }
}
