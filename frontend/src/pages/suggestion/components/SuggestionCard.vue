<script setup lang="ts">
import { Crown } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { Separator } from '@/components/ui/separator'
import { RecordEntity, RecordGenre } from '@/lib/api'
import { GENRE_REGISTRY } from '@/lib/genre-registry'
import SuggestionItemCard from '@/pages/suggestion/components/SuggestionItemCard.vue'
import {
  groupSuggestions,
  type SuggestionSortBy,
} from '@/pages/suggestion/composables/suggestion-groups'
import { useUser } from '@/stores/use-user'

const props = defineProps<{
  items: RecordEntity[]
  sortBy: SuggestionSortBy
}>()

const { isAdmin } = storeToRefs(useUser())

const groupedItems = computed(() => groupSuggestions(props.items, props.sortBy))

type GenreValue = `${RecordGenre}`

function getGroupTitle(genre: GenreValue): string {
  return GENRE_REGISTRY[genre].label
}

const genreIcons = Object.fromEntries(
  Object.values(GENRE_REGISTRY).map((entry) => [entry.genre, entry.icon]),
) as Record<GenreValue, (typeof GENRE_REGISTRY)[RecordGenre]['icon']>

const collapsedGenres = ref<Set<string>>(new Set())

function toggleGenreCollapse(genre: string) {
  if (collapsedGenres.value.has(genre)) {
    collapsedGenres.value.delete(genre)
  } else {
    collapsedGenres.value.add(genre)
  }
}
</script>

<template>
  <div>
    <p class="pb-4 text-white text-2xl">
      <slot name="title" />
    </p>

    <template v-for="({ key: genre, items: groupItems }, index) in groupedItems" :key="genre">
      <Separator v-if="genre !== 'queued' && index > 0" class="mb-6" />
      <div class="mb-8">
        <div v-if="genre === 'queued'" class="flex items-center justify-center gap-2 mb-4">
          <Crown class="w-5 h-5 text-yellow-400" />
          <h3 class="text-xl text-yellow-400 font-medium">В очереди</h3>
        </div>
        <h3
          v-else
          class="text-xl text-white mb-4 font-medium text-center cursor-pointer select-none transition-opacity duration-300"
          :class="{ 'opacity-60': collapsedGenres.has(genre) }"
          @click="toggleGenreCollapse(genre)"
        >
          <component
            :is="genreIcons[genre as GenreValue]"
            class="w-5 h-5 inline-block mr-2 align-text-bottom"
          />
          {{ getGroupTitle(genre as GenreValue) }}
        </h3>
        <transition name="collapse">
          <div
            v-if="genre === 'queued' || !collapsedGenres.has(genre)"
            class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,400px),1fr))] gap-4 sm:gap-8"
          >
            <SuggestionItemCard
              v-for="item in groupItems"
              :key="item.id"
              :item="item"
              :is-admin="isAdmin"
            />
          </div>
        </transition>
      </div>
    </template>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.collapse-enter-active {
  transition:
    max-height 1s ease-out,
    opacity 0.5s ease-out;
  overflow: visible;
}

.collapse-leave-active {
  transition:
    max-height 0.5s ease-out,
    opacity 0.5s ease-out;
  overflow: visible;
}

.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  max-height: 2000px;
  opacity: 1;
}
</style>
