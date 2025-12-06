<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { QueueItemDto } from "@/lib/api.ts"
import { generateWatchLink } from "@/lib/utils/generate-watch-link"
import { getImageUrl } from "@/lib/utils/image.ts"

defineProps<{ items: QueueItemDto[] }>()

function isShow(item: QueueItemDto) {
  return item.title && item.login
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.src = "/images/aga.webp"
}
</script>

<template>
  <div>
    <p class="pb-4 text-white text-2xl">
      <slot name="title" />
    </p>
    <div class="grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))] gap-4">
      <template v-for="(item, index) in items" :key="index">
        <Card
          v-if="isShow(item)"
          class="bg-[var(--n-action-color)] min-h-[200px] flex flex-col"
        >
          <div class="flex flex-1 h-full">
            <div v-if="item.posterUrl" class="relative w-[130px] flex-shrink-0 bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-tl-[calc(var(--radius)+4px)] rounded-bl-[calc(var(--radius)+4px)]">
              <img
                :src="getImageUrl(item.posterUrl)"
                class="w-full h-full object-cover rounded-tl-[calc(var(--radius)+4px)] rounded-bl-[calc(var(--radius)+4px)] aspect-[2/3]"
                alt=""
                @error="handleImageError"
              >
            </div>
            <div v-else class="relative w-[130px] flex-shrink-0 bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-tl-[calc(var(--radius)+4px)] rounded-bl-[calc(var(--radius)+4px)] flex items-center justify-center aspect-[2/3]">
              <span class="text-white text-xs text-center px-2">{{ item.title?.slice(0, 20) }}...</span>
            </div>
            <div class="flex flex-col flex-1 justify-between overflow-hidden">
              <CardHeader>
                <CardTitle class="text-xl overflow-hidden line-clamp-2 max-w-full box-border">
                  <a :href="generateWatchLink(item.link) || item.link" target="_blank" class="hover:underline">
                    {{ item.title }}
                  </a>
                </CardTitle>
              </CardHeader>
              <CardContent class="flex flex-col items-start gap-3 w-full px-6 py-2">
                <div class="flex justify-between w-full">
                  <div class="flex items-center">
                    <Avatar class="w-8 h-8 mr-2">
                      <AvatarImage :src="item.profileImageUrl" />
                      <AvatarFallback />
                    </Avatar>
                    <div class="text-base text-white font-medium">
                      {{ item.login }}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter class="text-sm block whitespace-nowrap overflow-hidden text-ellipsis">
                <span class="text-xs text-muted-foreground">{{ item.createdAt }}</span>
              </CardFooter>
            </div>
          </div>
        </Card>
      </template>
    </div>
  </div>
</template>
