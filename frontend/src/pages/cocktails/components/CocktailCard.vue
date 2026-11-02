<script setup lang="ts">
import { computed } from 'vue'
import { pluralRu } from '@/utils/plural-ru'
import type { CocktailMethodValue, MatchedCocktail } from '@/pages/cocktails/types'

const METHOD_LABELS: Record<CocktailMethodValue, string> = {
  SHAKE: 'шейкер',
  STIR: 'размешать',
  BUILD: 'билд',
  BLEND: 'блендер',
}

const props = defineProps<{
  cocktail: MatchedCocktail
}>()

const methodLabel = computed(() => METHOD_LABELS[props.cocktail.method])
const missingCoreLabel = computed(() => props.cocktail.missingCore.join(', '))
const missingExtraLabel = computed(() => props.cocktail.missingExtra.join(', '))
const availableLabel = computed(() => {
  const total = props.cocktail.ingredients.length
  const present = props.cocktail.ingredients.filter((ingredient) => ingredient.present).length
  return `${present} из ${total} ${pluralRu(total, ['ингредиента', 'ингредиентов', 'ингредиентов'])}`
})
</script>

<template>
  <article
    class="flex flex-col gap-4 rounded-xl border border-white/10 bg-[var(--n-action-color)] p-4 transition-colors hover:border-white/20"
  >
    <header class="flex flex-col gap-1">
      <div class="flex items-start justify-between gap-3">
        <h3 class="text-lg font-semibold leading-tight">{{ cocktail.name }}</h3>
        <span class="shrink-0 text-xs uppercase tracking-wide text-muted-foreground">
          {{ methodLabel }}
        </span>
      </div>
      <p class="text-xs text-muted-foreground">{{ cocktail.glass }} · {{ availableLabel }}</p>
    </header>

    <ul class="flex flex-col gap-1">
      <li
        v-for="ingredient in cocktail.ingredients"
        :key="ingredient.id"
        class="flex items-baseline gap-2 text-sm"
      >
        <span
          class="size-1.5 shrink-0 self-center rounded-full"
          :class="ingredient.present ? 'bg-green-500' : 'bg-zinc-600'"
          aria-hidden="true"
        />
        <span :class="ingredient.present ? 'text-foreground' : 'text-muted-foreground'">
          {{ ingredient.name }}
        </span>
        <span class="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
          {{ ingredient.amount }}
        </span>
      </li>
    </ul>

    <div v-if="missingCoreLabel" class="text-xs text-amber-400">
      Не хватает: {{ missingCoreLabel }}
    </div>
    <div v-if="missingExtraLabel" class="text-xs text-muted-foreground">
      По желанию: {{ missingExtraLabel }}
    </div>
    <p v-if="cocktail.garnish" class="text-xs text-muted-foreground">
      Украшение: {{ cocktail.garnish }}
    </p>
    <p v-if="cocktail.note" class="text-xs italic text-muted-foreground">{{ cocktail.note }}</p>

    <footer class="mt-auto border-t border-white/10 pt-2 text-xs text-muted-foreground">
      Источник:
      <a
        v-if="cocktail.sourceUrl"
        :href="cocktail.sourceUrl"
        target="_blank"
        rel="noreferrer noopener"
        class="underline underline-offset-2 transition-colors hover:text-foreground"
      >
        {{ cocktail.sourceName }}
      </a>
      <span v-else>{{ cocktail.sourceName }}</span>
    </footer>
  </article>
</template>
