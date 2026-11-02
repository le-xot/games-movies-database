<script setup lang="ts">
import { Check, ChevronDown } from '@lucide/vue'
import { computed, ref } from 'vue'
import { Skeleton } from '@/components/ui/skeleton'
import type { CocktailShelf } from '@/pages/cocktails/types'

const props = defineProps<{
  shelves: CocktailShelf[]
  selectedIds: string[]
  isLoading?: boolean
}>()

const emit = defineEmits<{
  toggle: [id: string]
}>()

/** На мобилке полки — аккордеон; на десктопе состояние раскрытия игнорируется. */
const expandedIds = ref<string[]>([])

const selected = computed(() => new Set(props.selectedIds))

function isExpanded(id: string) {
  return expandedIds.value.includes(id)
}

function toggleShelf(id: string) {
  expandedIds.value = isExpanded(id)
    ? expandedIds.value.filter((item) => item !== id)
    : [...expandedIds.value, id]
}

function selectedInShelf(shelf: CocktailShelf) {
  return shelf.ingredients.filter((ingredient) => selected.value.has(ingredient.id)).length
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div v-if="isLoading" class="flex flex-col gap-2">
      <Skeleton v-for="n in 5" :key="n" class="h-11 w-full rounded-lg" aria-hidden="true" />
    </div>

    <section
      v-for="shelf in shelves"
      :key="shelf.id"
      class="rounded-lg border border-white/10 bg-[var(--n-action-color)]"
    >
      <button
        type="button"
        class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium"
        :aria-expanded="isExpanded(shelf.id)"
        @click="toggleShelf(shelf.id)"
      >
        <span class="truncate">{{ shelf.title }}</span>
        <span class="ml-auto shrink-0 text-xs text-muted-foreground">
          {{ selectedInShelf(shelf) }}/{{ shelf.ingredients.length }}
        </span>
        <ChevronDown
          class="size-4 shrink-0 text-muted-foreground transition-transform lg:hidden"
          :class="{ 'rotate-180': isExpanded(shelf.id) }"
        />
      </button>

      <div class="px-3 pb-3" :class="isExpanded(shelf.id) ? 'block' : 'hidden lg:block'">
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="ingredient in shelf.ingredients"
            :key="ingredient.id"
            type="button"
            class="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors"
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
      </div>
    </section>
  </div>
</template>
