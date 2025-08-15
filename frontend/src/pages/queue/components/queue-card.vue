<script setup lang="ts">
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { QueueItemDto } from '@/lib/api.ts'
import { generateWatchLink } from '@/lib/utils/generate-watch-link'

defineProps<{ items: QueueItemDto[] }>()

function isShow(item: QueueItemDto) {
  return item.title && item.login
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
          class="bg-[var(--n-action-color)] h-full justify-between"
        >
          <CardHeader>
            <CardTitle class="text-xl overflow-hidden line-clamp-2 max-w-full box-border">
              <a :href="generateWatchLink(item.link) || item.link" target="_blank" class="hover:underline">
                {{ item.title }}
              </a>
            </CardTitle>
          </CardHeader>
          <CardFooter>
            <div class="w-full flex flex-wrap justify-between">
              <div class="flex justify-end">
                {{ item.login }}
              </div>
              <slot name="footer" :item="item" />
            </div>
          </CardFooter>
        </Card>
      </template>
    </div>
  </div>
</template>
