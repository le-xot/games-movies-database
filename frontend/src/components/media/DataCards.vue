<script setup lang="ts">
import { useVirtualizer } from '@tanstack/vue-virtual'
import { useEventListener, useMediaQuery, useResizeObserver } from '@vueuse/core'
import { computed, nextTick, onMounted, ref, watch, type ComponentPublicInstance } from 'vue'
import MediaCard from '@/components/media/MediaCard.vue'
import RecordCardSkeleton from '@/components/media/RecordCardSkeleton.vue'
import { useScrollContainer } from '@/composables/use-scroll-container'
import { RecordEntity, RecordUpdateDTO } from '@/lib/api'

const props = defineProps<{
  items: RecordEntity[]
  isLoading: boolean
  isLoadingNext: boolean
  hasNextPage: boolean
  hasEpisodeColumn: boolean
  deleteConfirmTitle: string
  /** Скрыть «пусто», когда ошибку показывает страница. */
  suppressEmptyState?: boolean
}>()

const emit = defineEmits<{
  update: [{ id: number; data: RecordUpdateDTO }]
  updatePoster: [{ id: number; url: string }]
  delete: [id: number]
  loadMore: []
}>()

const gridClass =
  'w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'

/** Сколько карточек-скелетонов показываем до первого ответа. */
const INITIAL_SKELETON_COUNT = 5
/** Оценка высоты строки для виртуализатора: одна колонка выше. */
const singleColumnRowHeight = 640
const multiColumnRowHeight = 520
/** Порог «долистал почти до конца» для автоподгрузки, px. */
const LOAD_MORE_THRESHOLD_PX = 600

// Скелетон показываем сразу: страница появляется вместе с ним, пустой области не видно.
const showSkeleton = computed(() => props.isLoading && props.items.length === 0)

const isSm = useMediaQuery('(min-width: 640px)')
const isMd = useMediaQuery('(min-width: 768px)')
const isLg = useMediaQuery('(min-width: 1024px)')
const isXl = useMediaQuery('(min-width: 1280px)')

const columns = computed(() => {
  if (isXl.value) return 5
  if (isLg.value) return 4
  if (isMd.value) return 3
  if (isSm.value) return 2
  return 1
})

const rows = computed(() => {
  const result: RecordEntity[][] = []
  for (let index = 0; index < props.items.length; index += columns.value) {
    result.push(props.items.slice(index, index + columns.value))
  }
  return result
})

const rowCount = computed(() => rows.value.length + (props.hasNextPage ? 1 : 0))

const scrollContainer = useScrollContainer()
const listRef = ref<HTMLElement | null>(null)
const scrollMargin = ref(0)

function updateScrollMargin() {
  const container = scrollContainer.value
  const list = listRef.value
  if (!container || !list) return
  scrollMargin.value =
    list.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop
}

const virtualizer = useVirtualizer(
  computed(() => ({
    count: rowCount.value,
    getScrollElement: () => scrollContainer.value,
    estimateSize: () => (columns.value === 1 ? singleColumnRowHeight : multiColumnRowHeight),
    overscan: 4,
    scrollMargin: scrollMargin.value,
  })),
)

const virtualRows = computed(() => virtualizer.value.getVirtualItems())
const totalSize = computed(() => virtualizer.value.getTotalSize())

function measureRow(element: Element | ComponentPublicInstance | null) {
  virtualizer.value.measureElement(element as HTMLElement | null)
}

onMounted(updateScrollMargin)
watch(listRef, updateScrollMargin, { flush: 'post' })
useResizeObserver(scrollContainer, updateScrollMargin)
useResizeObserver(() => listRef.value?.parentElement, updateScrollMargin)

function maybeLoadMore() {
  const container = scrollContainer.value
  if (!container || !props.hasNextPage || props.isLoadingNext || rows.value.length === 0) return
  const { scrollTop, clientHeight, scrollHeight } = container
  if (scrollTop + clientHeight >= scrollHeight - LOAD_MORE_THRESHOLD_PX) {
    emit('loadMore')
  }
}

useEventListener(scrollContainer, 'scroll', maybeLoadMore, { passive: true })
watch([() => props.items.length, () => props.hasNextPage, () => props.isLoadingNext], () =>
  nextTick(maybeLoadMore),
)
</script>

<template>
  <div v-if="!items.length && showSkeleton" :class="gridClass" class="data-fade-in">
    <RecordCardSkeleton v-for="n in INITIAL_SKELETON_COUNT" :key="n" with-badges />
  </div>

  <div v-else-if="items.length" ref="listRef" class="w-full data-fade-in">
    <div :style="{ height: `${totalSize}px`, position: 'relative', width: '100%' }">
      <div
        v-for="virtualRow in virtualRows"
        :key="String(virtualRow.key)"
        :data-index="virtualRow.index"
        :ref="measureRow"
        class="absolute top-0 left-0 w-full"
        :style="{ transform: `translateY(${virtualRow.start - scrollMargin}px)` }"
      >
        <div v-if="virtualRow.index < rows.length" :class="gridClass">
          <MediaCard
            v-for="item in rows[virtualRow.index]"
            :key="item.id"
            :item="item"
            :has-episode-column="hasEpisodeColumn"
            :delete-confirm-title="deleteConfirmTitle"
            @update="emit('update', $event)"
            @update-poster="emit('updatePoster', $event)"
            @delete="emit('delete', $event)"
          />
        </div>

        <div v-else :class="gridClass">
          <RecordCardSkeleton v-for="n in columns" :key="n" />
        </div>
      </div>
    </div>
  </div>

  <div
    v-else-if="!suppressEmptyState && !isLoading"
    class="h-24 flex items-center justify-center text-muted-foreground"
  >
    No results.
  </div>
</template>

<style scoped>
.data-fade-in {
  animation: data-fade-in 140ms ease;
}

@keyframes data-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .data-fade-in {
    animation: none;
  }
}
</style>
