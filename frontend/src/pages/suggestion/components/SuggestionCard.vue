<script setup lang="ts">
import {
  Baby,
  Crown,
  Film,
  Gamepad2,
  Gavel,
  Heart,
  JapaneseYen,
  ListOrdered,
  PencilOff,
  Popcorn,
  Trash2,
} from '@lucide/vue'
import { useThrottleFn } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { RecordEntity, RecordGenre, RecordType, UserRole } from '@/lib/api'
import { useLike } from '@/pages/suggestion/composables/use-like'
import { useSuggestion } from '@/pages/suggestion/composables/use-suggestion'
import { useNewRecords } from '@/stores/use-new-records'
import { useUser } from '@/stores/use-user'
import { generateWatchLink } from '@/utils/generate-watch-link'
import { getImageUrl } from '@/utils/image'

const props = defineProps<{
  items: RecordEntity[]
  sortBy: 'date' | 'likes'
}>()

const { isAdmin, currentUserId } = storeToRefs(useUser())

const like = useLike()
const suggestion = useSuggestion()
const newRecords = useNewRecords()

const likingStates = ref<Map<number, boolean>>(new Map())

const throttledLikeFunctions = computed(() => {
  const map = new Map<number, ReturnType<typeof useThrottleFn>>()

  for (const item of props.items) {
    if (!map.has(item.id)) {
      const throttledFn = useThrottleFn(async () => {
        if (likingStates.value.get(item.id)) return

        likingStates.value.set(item.id, true)
        try {
          if (isLikedByCurrentUser(item)) {
            await like.deleteLike(item.id)
          } else {
            await like.createLike(item.id)
          }
        } finally {
          likingStates.value.set(item.id, false)
        }
      }, 1000)

      map.set(item.id, throttledFn)
    }
  }

  return map
})

const groupedItems = computed(() => {
  const queuedItems: RecordEntity[] = []
  const groups = new Map<RecordGenre, RecordEntity[]>()

  for (const item of props.items) {
    if (!item.genre) continue

    if (isQueued(item)) {
      queuedItems.push(item)
      continue
    }

    if (!groups.has(item.genre)) {
      groups.set(item.genre, [])
    }

    groups.get(item.genre)!.push(item)
  }

  const sortItems = (items: RecordEntity[]) => {
    if (props.sortBy === 'date') {
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else {
      items.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
    }
  }

  queuedItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  for (const items of groups.values()) {
    sortItems(items)
  }

  const groupOrder: RecordGenre[] = [
    RecordGenre.MOVIE,
    RecordGenre.GAME,
    RecordGenre.ANIME,
    RecordGenre.CARTOON,
    RecordGenre.SERIES,
  ]

  const result: [string, RecordEntity[]][] = []

  if (queuedItems.length > 0) {
    result.push(['queued', queuedItems])
  }

  result.push(
    ...Array.from(groups.entries())
      .sort(([a], [b]) => groupOrder.indexOf(a) - groupOrder.indexOf(b))
      .map(([genre, items]): [string, RecordEntity[]] => [genre, items]),
  )

  return result
})

type GenreValue = `${RecordGenre}`

const genreTitles: Record<GenreValue, string> = {
  [RecordGenre.GAME]: 'Игры',
  [RecordGenre.MOVIE]: 'Фильмы',
  [RecordGenre.SERIES]: 'Сериалы',
  [RecordGenre.ANIME]: 'Аниме',
  [RecordGenre.CARTOON]: 'Мультфильмы',
} as const

const genreIcons: Record<GenreValue, typeof Gamepad2> = {
  [RecordGenre.GAME]: Gamepad2,
  [RecordGenre.MOVIE]: Film,
  [RecordGenre.SERIES]: Popcorn,
  [RecordGenre.ANIME]: JapaneseYen,
  [RecordGenre.CARTOON]: Baby,
}

function getGroupTitle(genre: GenreValue): string {
  return genreTitles[genre]
}

const isDialogOpen = ref(false)

function resetDialogState() {
  isDialogOpen.value = false
}

defineExpose({ isDialogOpen })

watch(isDialogOpen, (newValue) => {
  if (newValue) {
    suggestion.openSuggestionDialog(resetDialogState)
  }
})

function handleCardHover(recordId: number) {
  newRecords.markRecordAsViewed(recordId)
}

function isLikedByCurrentUser(item: RecordEntity) {
  return item.likes?.some((likeItem) => likeItem.userId === currentUserId.value) || false
}

function getLikesCount(item: RecordEntity) {
  return item.likes?.length || 0
}

function isQueued(item: RecordEntity) {
  return item.type === RecordType.WRITTEN
}

function handleLikeClick(itemId: number) {
  if (likingStates.value.get(itemId)) return

  const throttledFn = throttledLikeFunctions.value.get(itemId)
  if (throttledFn) {
    throttledFn()
  }
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.src = '/images/aga.webp'
}

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

    <template v-for="([genre, groupItems], index) in groupedItems" :key="genre">
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
            class="grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))] gap-8"
          >
            <div
              v-for="item in groupItems"
              :key="item.id"
              class="relative"
              @mouseenter="handleCardHover(item.id)"
            >
              <transition name="fade">
                <Badge
                  v-if="newRecords.isRecordNew(item.id)"
                  class="absolute -top-2 -right-2 z-10 bg-primary pointer-events-none text-primary-foreground text-base px-2 py-1"
                >
                  Новое
                </Badge>
              </transition>
              <Card
                class="bg-[var(--n-action-color)] min-h-[250px] flex flex-col transition-[height,border-color,border-width] duration-300"
                :class="{
                  'h-[250px]': isAdmin,
                  'border-2 border-primary': newRecords.isRecordNew(item.id) && !isQueued(item),
                  'border-2 border-yellow-400': isQueued(item),
                }"
              >
                <TooltipProvider :delay-duration="200">
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <button
                        v-if="!isQueued(item)"
                        size="sm"
                        :disabled="likingStates.get(item.id)"
                        :class="
                          isLikedByCurrentUser(item)
                            ? 'bg-red-500/50 border-red-500'
                            : 'bg-[hsla(var(--primary-foreground))] border-white'
                        "
                        class="flex justify-center outline-1 backdrop-blur-lg items-center gap-2 absolute -bottom-4 -right-4 z-10 rounded-full w-20 h-10 p-0"
                        @click="handleLikeClick(item.id)"
                      >
                        <Heart
                          v-if="isLikedByCurrentUser(item)"
                          color="red"
                          fill="rgb(239 68 68)"
                          class="w-6 h-6"
                        />
                        <Heart v-else class="w-6 h-6" />
                        <span class="ml-1">{{ getLikesCount(item) }}</span>
                      </button>
                      <div
                        v-else
                        class="flex justify-center outline-1 backdrop-blur-lg items-center gap-2 absolute -bottom-4 -right-4 z-10 rounded-full w-20 h-10 p-0 bg-yellow-400/30 border-yellow-400"
                      >
                        <Crown class="w-6 h-6 text-yellow-400" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      v-if="!isQueued(item) && item.likes?.length"
                      side="top"
                      class="flex flex-col gap-1.5 p-2"
                    >
                      <div
                        v-for="likeItem in item.likes"
                        :key="likeItem.id"
                        class="flex items-center gap-2"
                      >
                        <Avatar class="w-5 h-5">
                          <AvatarImage
                            v-if="likeItem.user?.profileImageUrl"
                            :src="likeItem.user.profileImageUrl"
                          />
                          <AvatarFallback />
                        </Avatar>
                        <span class="text-sm">{{ likeItem.user?.login }}</span>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div class="flex flex-1 h-full">
                  <div
                    v-if="item.posterUrl"
                    class="relative w-[130px] flex-shrink-0 bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-tl-[calc(var(--radius)+4px)] rounded-bl-[calc(var(--radius)+4px)]"
                  >
                    <img
                      :src="getImageUrl(item.posterUrl)"
                      class="w-full h-full object-cover rounded-tl-[calc(var(--radius)+4px)] rounded-bl-[calc(var(--radius)+4px)] aspect-[2/3]"
                      alt=""
                      @error="handleImageError"
                    />
                  </div>
                  <div
                    v-else
                    class="relative w-[130px] flex-shrink-0 bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-tl-[calc(var(--radius)+4px)] rounded-bl-[calc(var(--radius)+4px)] flex items-center justify-center aspect-[2/3]"
                  >
                    <span class="text-white text-xs text-center px-2"
                      >{{ item.title?.slice(0, 20) }}...</span
                    >
                  </div>
                  <div class="flex flex-col flex-1 justify-between overflow-hidden">
                    <CardHeader>
                      <CardTitle class="text-xl overflow-hidden line-clamp-2 max-w-full box-border">
                        <a
                          :href="generateWatchLink(item.link) || item.link"
                          target="_blank"
                          class="hover:underline"
                        >
                          {{ item.title }}
                        </a>
                      </CardTitle>
                    </CardHeader>
                    <CardContent
                      class="text-sm text-[#1e90ff] underline italic block whitespace-nowrap overflow-hidden text-ellipsis"
                    >
                      <a :href="item.link" target="_blank">{{ item.link }}</a>
                    </CardContent>
                    <CardFooter class="flex flex-col items-start gap-3 w-full px-6 py-2">
                      <div class="flex justify-between w-full">
                        <div
                          v-if="
                            !isQueued(item) &&
                            item.suggestionOwnership?.user &&
                            item.suggestionOwnership.user.role === UserRole.USER &&
                            item.suggestionOwnership.user.id === currentUserId
                          "
                          class="flex justify-end w-full mt-auto gap-2"
                        >
                          <Button
                            variant="destructive"
                            size="sm"
                            class="text-sm text-white w-full"
                            @click="suggestion.handleDeleteOwnSuggestion(item.id)"
                          >
                            Удалить
                          </Button>
                        </div>
                      </div>
                      <div class="flex justify-between w-full">
                        <div v-if="isAdmin" class="flex justify-between w-full mt-auto gap-3 mb-3">
                          <Button
                            v-if="!isQueued(item)"
                            variant="default"
                            size="sm"
                            class="text-sm w-36"
                            @click="suggestion.handleApproveSuggestion(item.id)"
                          >
                            <ListOrdered />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            class="text-sm w-36"
                            @click="suggestion.handleMoveToAuction(item.id)"
                          >
                            <Gavel />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            class="text-sm w-36"
                            @click="suggestion.handlePatchSuggestion(item.id)"
                          >
                            <PencilOff />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            class="text-sm w-36"
                            @click="suggestion.handleDeleteSuggestion(item.id)"
                          >
                            <Trash2 color="#ffffff" />
                          </Button>
                        </div>
                      </div>
                      <div
                        v-if="item.suggestionOwnership?.user"
                        class="flex justify-between w-full mb-3"
                      >
                        <div class="flex items-center">
                          <Avatar class="w-8 h-8 mr-2">
                            <AvatarImage :src="item.suggestionOwnership.user.profileImageUrl" />
                            <AvatarFallback />
                          </Avatar>
                          <div class="text-base text-white font-medium">
                            {{ item.suggestionOwnership.user.login }}
                          </div>
                        </div>
                      </div>
                    </CardFooter>
                  </div>
                </div>
              </Card>
            </div>
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
