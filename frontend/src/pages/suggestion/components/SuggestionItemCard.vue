<script setup lang="ts">
import { Crown, Heart, ListOrdered, PencilOff, Trash2 } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import MediaPoster from '@/components/media/MediaPoster.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import UserAvatar from '@/components/user/UserAvatar.vue'
import { RecordEntity, UserRole } from '@/lib/api'
import { isQueuedRecord } from '@/pages/suggestion/composables/suggestion-groups'
import { useLike } from '@/pages/suggestion/composables/use-like'
import { useSuggestion } from '@/pages/suggestion/composables/use-suggestion'
import { useNewRecords } from '@/stores/use-new-records'
import { useUser } from '@/stores/use-user'
import { generateWatchLink } from '@/utils/generate-watch-link'

defineProps<{ item: RecordEntity; isAdmin: boolean }>()

const suggestion = useSuggestion()
const like = useLike()
const newRecords = useNewRecords()
const { currentUserId } = storeToRefs(useUser())

const likingStates = ref<Map<number, boolean>>(new Map())
const LIKE_THROTTLE_MS = 1000
const likeThrottleTimestamps = new Map<number, number>()

function triggerAnimation(itemId: number, direction: 'like' | 'unlike') {
  const btn = document.querySelector(`[data-like-btn="${itemId}"]`) as HTMLElement | null
  if (!btn) return
  btn.animate(
    direction === 'like'
      ? [{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }]
      : [{ transform: 'scale(1)' }, { transform: 'scale(0.8)' }, { transform: 'scale(1)' }],
    { duration: 300, easing: 'ease-out' },
  )
}

function isLikedByCurrentUser(item: RecordEntity) {
  return item.likes?.some((likeItem) => likeItem.userId === currentUserId.value) || false
}

function getLikesCount(item: RecordEntity) {
  return item.likes?.length || 0
}

async function handleLikeClick(item: RecordEntity) {
  if (likingStates.value.get(item.id)) return

  const now = Date.now()
  const lastClick = likeThrottleTimestamps.get(item.id) ?? 0
  if (now - lastClick < LIKE_THROTTLE_MS) return
  likeThrottleTimestamps.set(item.id, now)

  likingStates.value.set(item.id, true)
  try {
    if (isLikedByCurrentUser(item)) {
      await like.deleteLike(item.id)
      triggerAnimation(item.id, 'unlike')
    } else {
      await like.createLike(item.id)
      triggerAnimation(item.id, 'like')
    }
  } finally {
    likingStates.value.set(item.id, false)
  }
}

function adminActions(item: RecordEntity) {
  return [
    ...(!isQueuedRecord(item)
      ? [
          {
            key: 'approve',
            variant: 'default' as const,
            icon: ListOrdered,
            action: () => suggestion.handleApproveSuggestion(item.id),
          },
        ]
      : []),
    {
      key: 'patch',
      variant: 'outline' as const,
      icon: PencilOff,
      action: () => suggestion.handlePatchSuggestion(item.id),
    },
    {
      key: 'delete',
      variant: 'destructive' as const,
      icon: Trash2,
      action: () => suggestion.handleDeleteSuggestion(item.id),
    },
  ]
}
</script>

<template>
  <div class="relative" @mouseenter="newRecords.markRecordAsViewed(item.id)">
    <transition name="fade">
      <Badge
        v-if="newRecords.isRecordNew(item.id)"
        class="absolute -top-2 -right-2 z-10 bg-primary pointer-events-none text-primary-foreground text-base px-2 py-1"
      >
        Новое
      </Badge>
    </transition>
    <Card
      class="min-h-[250px] flex flex-col transition-[height,border-color,border-width] duration-300"
      :class="{
        'sm:h-[250px]': isAdmin,
        'border-2 border-primary': newRecords.isRecordNew(item.id) && !isQueuedRecord(item),
        'border-2 border-yellow-400': isQueuedRecord(item),
      }"
    >
      <TooltipProvider :delay-duration="200">
        <Tooltip>
          <TooltipTrigger as-child>
            <button
              v-if="!isQueuedRecord(item)"
              :data-like-btn="item.id"
              size="sm"
              :disabled="likingStates.get(item.id)"
              :class="
                isLikedByCurrentUser(item)
                  ? 'bg-red-500/50 border-red-500'
                  : 'bg-[hsla(var(--primary-foreground))] border-white'
              "
              class="flex justify-center outline-1 backdrop-blur-lg items-center gap-2 absolute -bottom-4 -right-4 z-10 rounded-full w-20 h-10 p-0"
              @click="handleLikeClick(item)"
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
            v-if="!isQueuedRecord(item) && item.likes?.length"
            side="top"
            class="flex flex-col gap-1.5 p-2"
          >
            <div v-for="likeItem in item.likes" :key="likeItem.id" class="flex items-center gap-2">
              <UserAvatar
                v-if="likeItem.user"
                :profile-image-url="likeItem.user.profileImageUrl"
                :login="likeItem.user.login"
                :frame-id="likeItem.user.avatarFrameId"
                size="size-5"
              />
              <span class="text-sm">{{ likeItem.user?.login }}</span>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <div class="flex flex-1 h-full">
        <MediaPoster
          :url="item.posterUrl"
          :label="`${item.title?.slice(0, 20)}...`"
          class="w-[130px] aspect-[2/3] rounded-tl-[calc(var(--radius)+4px)] rounded-bl-[calc(var(--radius)+4px)]"
        />
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
                  !isQueuedRecord(item) &&
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
              <div v-if="isAdmin" class="flex flex-wrap justify-between w-full mt-auto gap-2 mb-3">
                <Button
                  v-for="action in adminActions(item)"
                  :key="action.key"
                  :variant="action.variant"
                  size="sm"
                  class="text-sm flex-1 min-w-0"
                  @click="action.action()"
                >
                  <component :is="action.icon" />
                </Button>
              </div>
            </div>
            <div v-if="item.suggestionOwnership?.user" class="flex justify-between w-full mb-3">
              <div class="flex items-center">
                <UserAvatar
                  :profile-image-url="item.suggestionOwnership.user.profileImageUrl"
                  :login="item.suggestionOwnership.user.login"
                  :frame-id="item.suggestionOwnership.user.avatarFrameId"
                  size="size-8"
                  class="mr-2"
                />
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
