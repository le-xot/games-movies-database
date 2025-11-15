<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useNewRecords } from '@/composables/use-new-records'
import { useUser } from '@/composables/use-user'
import { RecordEntity, RecordGenre, UserRole } from '@/lib/api.ts'
import { generateWatchLink } from '@/lib/utils/generate-watch-link.ts'
import { useLike } from '@/pages/suggestion/composables/use-like.ts'
import { useThrottleFn } from '@vueuse/core'
import { Gavel, Heart, ListOrdered, PencilOff, Trash2 } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useSuggestion } from '../composables/use-suggestion'

const props = defineProps<{ items: RecordEntity[] }>()

const { isAdmin, currentUserId } = storeToRefs(useUser())

const like = useLike()
const suggestion = useSuggestion()
const newRecords = useNewRecords()

const throttledLikeFunctions = computed(() => {
  const map = new Map<number, ReturnType<typeof useThrottleFn>>()

  for (const item of props.items) {
    if (!map.has(item.id)) {
      const throttledFn = useThrottleFn(async () => {
        if (isLikedByCurrentUser(item)) {
          await like.deleteLike(item.id)
        } else {
          await like.createLike(item.id)
        }
      }, 1000)

      map.set(item.id, throttledFn)
    }
  }

  return map
})

const groupedItems = computed(() => {
  const groups = new Map<string, RecordEntity[]>()

  for (const item of props.items) {
    const genre = item.genre || 'other'
    if (!groups.has(genre)) {
      groups.set(genre, [])
    }
    groups.get(genre)!.push(item)
  }

  return Array.from(groups.entries())
})

function getGroupTitle(genre: string): string {
  switch (genre) {
    case RecordGenre.GAME: return 'Игры:'
    case RecordGenre.MOVIE: return 'Фильмы:'
    case RecordGenre.SERIES: return 'Сериалы:'
    case RecordGenre.ANIME: return 'Аниме:'
    case RecordGenre.CARTOON: return 'Мультфильмы:'
    default: return 'Другое:'
  }
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
  return item.likes?.some(like => like.userId === currentUserId.value) || false
}

function getLikesCount(item: RecordEntity) {
  return item.likes?.length || 0
}

function handleLikeClick(itemId: number) {
  const throttledFn = throttledLikeFunctions.value.get(itemId)
  if (throttledFn) {
    throttledFn()
  }
}
</script>

<template>
  <div>
    <p class="pb-4 text-white text-2xl">
      <slot name="title" />
    </p>

    <div v-for="[genre, groupItems] in groupedItems" :key="genre" class="mb-8">
      <h3 class="text-xl text-white mb-4 font-medium">
        {{ getGroupTitle(genre) }}
      </h3>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))] gap-8">
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
            :class="{ 'h-[250px]': isAdmin, 'border-2 border-primary': newRecords.isRecordNew(item.id) }"
          >
            <button
              variant="outline"
              size="sm"
              :class="isLikedByCurrentUser(item) ? 'bg-red-500/50 border-red-500' : 'bg-[hsla(var(--primary-foreground))] border-white'"
              class="flex justify-center backdrop-blur-lg items-center gap-2 absolute -bottom-4 -right-4 z-10 rounded-full w-20 h-10 p-0"
              @click="handleLikeClick(item.id)"
            >
              <Heart v-if="isLikedByCurrentUser(item)" color="red" fill="rgb(239 68 68)" class="w-6 h-6" />
              <Heart v-else class="w-6 h-6" />
              <span class="ml-1">{{ getLikesCount(item) }}</span>
            </button>
            <div class="flex flex-1 h-full">
              <div v-if="item.posterUrl" class="relative w-[130px] flex-shrink-0">
                <img
                  :src="item.posterUrl"
                  class="w-full h-full object-cover rounded-tl-[calc(var(--radius)+4px)] rounded-bl-[calc(var(--radius)+4px)]"
                  alt="Poster"
                >
              </div>
              <div class="flex flex-col flex-1 justify-between overflow-hidden">
                <CardHeader>
                  <CardTitle class="text-xl overflow-hidden line-clamp-2 max-w-full box-border">
                    <a :href="generateWatchLink(item.link) || item.link" target="_blank" class="hover:underline">
                      {{ item.title }}
                    </a>
                  </CardTitle>
                </CardHeader>
                <CardContent class="text-sm text-[#1e90ff] underline italic block whitespace-nowrap overflow-hidden text-ellipsis">
                  <a :href="item.link" target="_blank">{{ item.link }}</a>
                </CardContent>
                <CardFooter class="flex flex-col items-start gap-3 w-full px-6 py-2">
                  <div class="flex justify-between w-full">
                    <div v-if="item.user && item.user.role === UserRole.USER && item.user.id === currentUserId" class="flex justify-end w-full mt-auto gap-2">
                      <Button variant="destructive" size="sm" class="text-sm w-full" @click="suggestion.handleDeleteOwnSuggestion(item.id)">
                        Удалить
                      </Button>
                    </div>
                  </div>
                  <div class="flex justify-between w-full">
                    <div v-if="isAdmin" class="flex justify-between w-full mt-auto gap-3 mb-3">
                      <Button variant="default" size="sm" class="text-sm w-36" @click="suggestion.handleApproveSuggestion(item.id)">
                        <ListOrdered />
                      </Button>
                      <Button variant="secondary" size="sm" class="text-sm w-36" @click="suggestion.handleMoveToAuction(item.id)">
                        <Gavel />
                      </Button>
                      <Button variant="outline" size="sm" class="text-sm w-36" @click="suggestion.handlePatchSuggestion(item.id)">
                        <PencilOff />
                      </Button>
                      <Button variant="destructive" size="sm" class="text-sm w-36" @click="suggestion.handleDeleteSuggestion(item.id)">
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                  <div v-if="item.user" class="flex justify-between w-full mb-3">
                    <div class="flex items-center">
                      <Avatar class="w-8 h-8 mr-2">
                        <AvatarImage :src="item.user.profileImageUrl" />
                        <AvatarFallback />
                      </Avatar>
                      <div class="text-base text-white font-medium">
                        {{ item.user?.login }}
                      </div>
                    </div>
                  </div>
                </CardFooter>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
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
</style>
