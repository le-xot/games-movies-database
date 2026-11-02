<script setup lang="ts">
import { RotateCw, Search } from '@lucide/vue'
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import CocktailAddDialog from '@/pages/cocktails/components/CocktailAddDialog.vue'
import CocktailBarField from '@/pages/cocktails/components/CocktailBarField.vue'
import CocktailCard from '@/pages/cocktails/components/CocktailCard.vue'
import CocktailEmptyState from '@/pages/cocktails/components/CocktailEmptyState.vue'
import CocktailFilters from '@/pages/cocktails/components/CocktailFilters.vue'
import CocktailModeSwitch from '@/pages/cocktails/components/CocktailModeSwitch.vue'
import { filterMatches } from '@/pages/cocktails/composables/cocktail-filter'
import { useCocktailBar } from '@/pages/cocktails/composables/use-cocktail-bar'
import { useCocktailCatalog } from '@/pages/cocktails/composables/use-cocktail-catalog'
import {
  MATCH_MAX_MISSING,
  useCocktailMatch,
} from '@/pages/cocktails/composables/use-cocktail-match'
import { pluralRu } from '@/utils/plural-ru'

const COCKTAIL_FORMS = ['коктейль', 'коктейля', 'коктейлей'] as const

const query = ref('')
// По умолчанию — только то, что можно смешать прямо сейчас.
const maxMissing = ref(0)
// Необязательные строки («по желанию») по умолчанию не мешают показывать коктейль.
const strictExtras = ref(false)
const isAddDialogOpen = ref(false)

const {
  shelves,
  isInitialLoading: isCatalogLoading,
  error: catalogError,
  refetch: refetchCatalog,
} = useCocktailCatalog()

const {
  mode,
  ingredientIds,
  isSaving,
  saveError,
  barLoadError,
  canUseOwnBar,
  isBarInitialLoading,
  toggle: toggleIngredient,
  switchMode,
  reloadBar,
} = useCocktailBar()

const {
  cocktails,
  isInitialLoading: isMatchLoading,
  error: matchError,
  refetch: refetchMatch,
} = useCocktailMatch(() => ingredientIds.value, {
  enabled: computed(() => ingredientIds.value.length > 0),
})

const visibleCocktails = computed(() =>
  filterMatches(cocktails.value, maxMissing.value, query.value, strictExtras.value),
)

const ingredientNames = computed(() => {
  const names = new Map<string, string>()
  for (const shelf of shelves.value) {
    for (const ingredient of shelf.ingredients) names.set(ingredient.id, ingredient.name)
  }
  return names
})

const barChips = computed(() =>
  ingredientIds.value.map((id) => ({ id, name: ingredientNames.value.get(id) ?? id })),
)

const needsLogin = computed(() => mode.value === 'mine' && !canUseOwnBar.value)
const hasCatalogError = computed(() => Boolean(catalogError.value))
const hasMatchError = computed(() => Boolean(matchError.value))
const hasBarLoadError = computed(() => Boolean(barLoadError.value))
const showSkeletons = computed(() => isBarInitialLoading.value || isMatchLoading.value)

const hasEmptyBar = computed(
  () =>
    !isBarInitialLoading.value &&
    !needsLogin.value &&
    !hasBarLoadError.value &&
    ingredientIds.value.length === 0,
)

const resultsSummary = computed(() => {
  if (showSkeletons.value || hasEmptyBar.value || needsLogin.value) return ''
  if (hasBarLoadError.value) return ''

  // `total` считаем с тем же фильтром по имени, что и `shown`: иначе поиск
  // занижает выдачу, а «ещё N с докупкой» раздувается остатком справочника.
  const total = filterMatches(
    cocktails.value,
    MATCH_MAX_MISSING,
    query.value,
    strictExtras.value,
  ).length
  const shown = visibleCocktails.value.length
  if (shown === total) return `${total} ${pluralRu(total, COCKTAIL_FORMS)}`

  // «194» — не размер справочника, а всё, что нашлось при докупке до максимума.
  const hidden = total - shown
  return `${shown} ${pluralRu(shown, COCKTAIL_FORMS)} сейчас · ещё ${hidden} ${pluralRu(hidden, COCKTAIL_FORMS)} с докупкой`
})

const emptySearchDescription = computed(() => {
  if (query.value.trim() !== '') return `По запросу «${query.value.trim()}» ничего не нашлось.`
  return 'Разрешите докупку или добавьте ингредиенты'
})

function retry() {
  if (hasCatalogError.value) void refetchCatalog()
  if (hasMatchError.value) void refetchMatch()
  if (hasBarLoadError.value) reloadBar()
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="flex flex-col gap-4">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">Коктейли</h1>
        <p class="text-sm text-muted-foreground">
          Отметьте, что стоит у вас на полке, и посмотрите, что из этого можно смешать.
        </p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <CocktailModeSwitch :model-value="mode" @update:model-value="switchMode" />

        <div v-if="isSaving || saveError" class="flex flex-col items-start gap-1 sm:items-end">
          <span v-if="isSaving" class="text-xs text-muted-foreground">Сохраняем…</span>
          <span v-else-if="saveError" class="text-xs text-destructive">{{ saveError }}</span>
        </div>
      </div>
    </header>

    <CocktailBarField
      :chips="barChips"
      :is-loading="isBarInitialLoading || isCatalogLoading"
      :readonly="needsLogin"
      @remove="toggleIngredient"
      @add="isAddDialogOpen = true"
    />

    <CocktailAddDialog
      v-model:open="isAddDialogOpen"
      :shelves="shelves"
      :selected-ids="ingredientIds"
      :is-loading="isCatalogLoading"
      @toggle="toggleIngredient"
    />

    <section class="flex min-w-0 flex-col gap-4">
      <div
        v-if="hasCatalogError || hasMatchError || hasBarLoadError"
        class="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-[var(--n-action-color)] px-4 py-3"
      >
        <span class="text-sm text-destructive">
          {{
            hasBarLoadError
              ? barLoadError
              : hasCatalogError
                ? 'Не удалось загрузить полки'
                : 'Не удалось подобрать коктейли'
          }}
        </span>
        <Button variant="outline" size="sm" @click="retry">
          <RotateCw />
          Повторить
        </Button>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Что можно смешать
          </h2>
          <span class="text-xs text-muted-foreground">{{ resultsSummary }}</span>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
          <div class="relative sm:w-44">
            <Search
              class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              v-model="query"
              type="search"
              placeholder="Найти коктейль"
              aria-label="Найти коктейль"
              class="pl-9"
            />
          </div>

          <CocktailFilters v-model="maxMissing" v-model:strict-extras="strictExtras" />
        </div>
      </div>

      <div v-if="showSkeletons" class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Skeleton v-for="n in 4" :key="n" class="h-64 w-full rounded-xl" aria-hidden="true" />
      </div>

      <CocktailEmptyState
        v-else-if="needsLogin"
        title="Мой бар доступен после входа"
        description="Войдите через Twitch, Kick или Telegram — и набор ингредиентов сохранится в аккаунте. Пока можно пользоваться гостевым режимом."
      />

      <CocktailEmptyState
        v-else-if="hasEmptyBar"
        title="Бар пока пуст"
        description="Добавьте то, что стоит у вас на полке"
      />

      <CocktailEmptyState
        v-else-if="visibleCocktails.length === 0 && !hasMatchError && !hasBarLoadError"
        title="Ничего не нашлось"
        :description="emptySearchDescription"
      />

      <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CocktailCard
          v-for="cocktail in visibleCocktails"
          :key="cocktail.id"
          :cocktail="cocktail"
        />
      </div>
    </section>
  </div>
</template>
