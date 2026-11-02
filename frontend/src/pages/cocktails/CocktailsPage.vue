<script setup lang="ts">
import { RotateCw, Search } from '@lucide/vue'
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import CocktailCard from '@/pages/cocktails/components/CocktailCard.vue'
import CocktailEmptyState from '@/pages/cocktails/components/CocktailEmptyState.vue'
import CocktailMaxMissingSlider from '@/pages/cocktails/components/CocktailMaxMissingSlider.vue'
import CocktailModeSwitch from '@/pages/cocktails/components/CocktailModeSwitch.vue'
import CocktailShelves from '@/pages/cocktails/components/CocktailShelves.vue'
import { filterMatches } from '@/pages/cocktails/composables/cocktail-filter'
import { useCocktailBar } from '@/pages/cocktails/composables/use-cocktail-bar'
import { useCocktailCatalog } from '@/pages/cocktails/composables/use-cocktail-catalog'
import { useCocktailMatch } from '@/pages/cocktails/composables/use-cocktail-match'
import { pluralRu } from '@/utils/plural-ru'

const COCKTAIL_FORMS = ['коктейль', 'коктейля', 'коктейлей'] as const
const INGREDIENT_FORMS = ['ингредиент', 'ингредиента', 'ингредиентов'] as const

const query = ref('')
const maxMissing = ref(3)

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
  isLoggedIn,
  isBarInitialLoading,
  toggle: toggleIngredient,
  switchMode,
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
  filterMatches(cocktails.value, maxMissing.value, query.value),
)

const hasEmptyBar = computed(() => !isBarInitialLoading.value && ingredientIds.value.length === 0)
const needsLogin = computed(() => mode.value === 'mine' && !isLoggedIn.value)
const hasCatalogError = computed(() => Boolean(catalogError.value))
const hasMatchError = computed(() => Boolean(matchError.value))
const showSkeletons = computed(() => isBarInitialLoading.value || isMatchLoading.value)

const barSummary = computed(() => {
  const count = ingredientIds.value.length
  return `${count} ${pluralRu(count, INGREDIENT_FORMS)} в баре`
})

const resultsSummary = computed(() => {
  if (showSkeletons.value || hasEmptyBar.value || needsLogin.value) return ''
  const total = cocktails.value.length
  const shown = visibleCocktails.value.length
  if (shown === total) return `${total} ${pluralRu(total, COCKTAIL_FORMS)}`
  return `${shown} из ${total}`
})

const emptySearchDescription = computed(() => {
  if (query.value.trim() !== '') return `По запросу «${query.value.trim()}» ничего не нашлось.`
  return 'Попробуйте допустить больше недостающих ингредиентов или отметьте на полках то, что уже есть.'
})

function retry() {
  if (hasCatalogError.value) void refetchCatalog()
  if (hasMatchError.value) void refetchMatch()
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

        <div class="flex flex-col items-start gap-1 sm:items-end">
          <span class="text-xs text-muted-foreground">{{ barSummary }}</span>
          <span v-if="isSaving" class="text-xs text-muted-foreground">Сохраняем…</span>
          <span v-else-if="saveError" class="text-xs text-destructive">{{ saveError }}</span>
        </div>
      </div>
    </header>

    <div
      class="flex flex-col gap-4 rounded-xl border border-white/10 bg-[var(--n-action-color)] p-3 sm:flex-row sm:items-center"
    >
      <div class="relative w-full sm:max-w-xs">
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

      <CocktailMaxMissingSlider v-model="maxMissing" class="sm:ml-auto sm:w-72" />
    </div>

    <div class="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
      <aside
        class="flex min-w-0 flex-col gap-2 lg:sticky lg:top-2 lg:max-h-[calc(100dvh-180px)] lg:overflow-y-auto lg:pr-1"
      >
        <h2 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Полки</h2>
        <CocktailShelves
          :shelves="shelves"
          :selected-ids="ingredientIds"
          :is-loading="isCatalogLoading"
          @toggle="toggleIngredient"
        />
      </aside>

      <section class="flex min-w-0 flex-col gap-4">
        <div
          v-if="hasCatalogError || hasMatchError"
          class="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-[var(--n-action-color)] px-4 py-3"
        >
          <span class="text-sm text-destructive">
            {{ hasCatalogError ? 'Не удалось загрузить полки' : 'Не удалось подобрать коктейли' }}
          </span>
          <Button variant="outline" size="sm" @click="retry">
            <RotateCw />
            Повторить
          </Button>
        </div>

        <div class="flex items-baseline justify-between gap-3">
          <h2 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Что можно смешать
          </h2>
          <span class="text-xs text-muted-foreground">{{ resultsSummary }}</span>
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
          description="Отметьте ингредиенты на полках слева — и здесь появятся коктейли, которые можно собрать."
        />

        <CocktailEmptyState
          v-else-if="visibleCocktails.length === 0 && !hasMatchError"
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
  </div>
</template>
