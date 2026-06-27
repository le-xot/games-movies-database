<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RecordEntity } from '@/lib/api'
import { useUser } from '@/stores/use-user'
import { getImageUrl } from '@/utils/image'

defineProps<{ items: RecordEntity[] }>()

const { isAdmin } = storeToRefs(useUser())

const isDialogOpen = ref(false)

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.src = '/images/aga.webp'
}

isDialogOpen.value = false

defineExpose({ isDialogOpen })
</script>

<template>
  <div>
    <p class="pb-4 text-white text-2xl">
      <slot name="title" />
    </p>

    <div class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,400px),1fr))] gap-4">
      <Card
        v-for="item in items"
        :key="item.id"
        class="bg-[var(--n-action-color)] min-h-[200px] flex flex-col transition-[height] duration-300"
        :class="{ 'h-[250px]': isAdmin }"
      >
        <div class="flex flex-1 h-full">
          <div v-if="item.posterUrl" class="relative w-[130px] flex-shrink-0">
            <img
              :src="getImageUrl(item.posterUrl)"
              class="w-full h-full object-cover rounded-tl-[calc(var(--radius)+4px)] rounded-bl-[calc(var(--radius)+4px)]"
              alt="Poster"
              @error="handleImageError"
            />
          </div>
          <div class="flex flex-col flex-1 justify-between overflow-hidden">
            <CardHeader>
              <CardTitle
                class="text-xl overflow-hidden line-clamp-2 max-w-full box-border"
                :title="item.title"
              >
                {{ item.title }}
              </CardTitle>
            </CardHeader>
            <CardContent
              class="text-sm text-[#1e90ff] underline italic block whitespace-nowrap overflow-hidden text-ellipsis"
            >
              <a :href="item.link" target="_blank">
                {{ item.link }}
              </a>
            </CardContent>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
