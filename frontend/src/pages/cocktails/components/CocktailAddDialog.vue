<script setup lang="ts">
import { Check, Search } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import type { CocktailIngredient, CocktailShelf } from '@/pages/cocktails/types'

const props = defineProps<{
  open: boolean
  shelves: CocktailShelf[]
  selectedIds: string[]
  isLoading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  toggle: [id: string]
}>()

const query = ref('')
const selected = computed(() => new Set(props.selectedIds))
const needle = computed(() => query.value.trim().toLowerCase())

// Каждый показ начинается с чистого поиска: прошлый запрос к новой полке не относится.
watch(
  () => props.open,
  (open) => {
    if (open) query.value = ''
  },
)

/**
 * Выбранные — первыми, но внутри каждой группы сохраняется порядок каталога:
 * два фильтра подряд не перемешивают чипы, а стабильная сортировка не даёт им
 * скакать при повторном клике.
 */
function selectedFirst(ingredients: CocktailIngredient[]): CocktailIngredient[] {
  return [
    ...ingredients.filter((ingredient) => selected.value.has(ingredient.id)),
    ...ingredients.filter((ingredient) => !selected.value.has(ingredient.id)),
  ]
}

const visibleShelves = computed(() =>
  props.shelves
    .map((shelf) => ({
      id: shelf.id,
      title: shelf.title,
      ingredients: shelf.ingredients.filter(
        (ingredient) => needle.value === '' || ingredient.name.toLowerCase().includes(needle.value),
      ),
    }))
    .filter((shelf) => shelf.ingredients.length > 0)
    .map((shelf) => ({ ...shelf, ingredients: selectedFirst(shelf.ingredients) })),
)
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent
      class="inset-0 flex h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-4 rounded-none p-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[85dvh] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:p-6"
    >
      <DialogHeader class="flex-row items-baseline justify-between gap-3 pr-8 text-left">
        <DialogTitle>Мой бар</DialogTitle>
        <span class="text-xs tabular-nums text-muted-foreground">
          выбрано: {{ selectedIds.length }}
        </span>
      </DialogHeader>

      <DialogDescription class="sr-only">
        Отметьте ингредиенты, которые стоят у вас на полке
      </DialogDescription>

      <div class="relative">
        <Search
          class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          v-model="query"
          type="search"
          placeholder="Найти ингредиент"
          aria-label="Найти ингредиент"
          class="pl-9"
        />
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto pr-1">
        <div v-if="isLoading" class="flex flex-col gap-2">
          <Skeleton v-for="n in 5" :key="n" class="h-11 w-full rounded-lg" aria-hidden="true" />
        </div>

        <template v-else>
          <section v-for="shelf in visibleShelves" :key="shelf.id" class="mb-3 flex flex-col gap-2">
            <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {{ shelf.title }}
            </h3>

            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="ingredient in shelf.ingredients"
                :key="ingredient.id"
                type="button"
                class="inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors"
                :class="
                  selected.has(ingredient.id)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-white/15 text-muted-foreground hover:border-white/30 hover:text-foreground'
                "
                :aria-pressed="selected.has(ingredient.id)"
                @click="emit('toggle', ingredient.id)"
              >
                <Check v-if="selected.has(ingredient.id)" class="size-3" />
                {{ ingredient.name }}
              </button>
            </div>
          </section>

          <p
            v-if="visibleShelves.length === 0"
            class="py-10 text-center text-sm text-muted-foreground"
          >
            Ничего не нашлось
          </p>
        </template>
      </div>

      <DialogFooter>
        <Button class="w-full sm:w-auto" @click="emit('update:open', false)">Готово</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
