<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/toast'
import { useUser } from '@/composables/use-user'
import { RecordEntity } from '@/lib/api.ts'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useAuctions } from '../composables/use-autions'

defineProps<{ items: RecordEntity[] }>()

const { isAdmin } = storeToRefs(useUser())

const auctions = useAuctions()

const isDialogOpen = ref(false)

isDialogOpen.value = false

defineExpose({ isDialogOpen })

async function handleApproveSuggestion(id: number) {
  try {
    await auctions.approveAuction(id)
    toast({
      title: 'Успешно',
      description: 'Совет одобрен',
      variant: 'default',
    })
  } catch {
    toast({
      title: 'Ошибка',
      description: auctions.error || 'Не удалось одобрить совет',
      variant: 'destructive',
    })
  }
}
</script>

<template>
  <div>
    <p class="pb-4 text-white text-2xl">
      <slot name="title" />
    </p>

    <div class="grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))] gap-4">
      <Card
        v-for="item in items"
        :key="item.id"
        class="bg-[var(--n-action-color)] min-h-[200px] flex flex-col transition-[height] duration-300"
        :class="{ 'h-[250px]': isAdmin }"
      >
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
              <CardTitle
                class="text-xl overflow-hidden line-clamp-2 max-w-full box-border"
                :title="item.title"
              >
                {{ item.title }}
              </CardTitle>
            </CardHeader>
            <CardContent class="text-sm text-[#1e90ff] underline italic block whitespace-nowrap overflow-hidden text-ellipsis">
              <a :href="item.link" target="_blank">
                {{ item.link }}
              </a>
            </CardContent>
            <CardFooter class="flex flex-col items-start gap-3 w-full">
              <div v-if="item.user" class="flex items-center gap-2">
                <Avatar class="w-8 h-8 mr-2">
                  <AvatarImage :src="item.user.profileImageUrl" />
                  <AvatarFallback />
                </Avatar>
                <div class="text-base text-white font-medium">
                  {{ item.user.login }}
                </div>
              </div>
              <div v-if="isAdmin" class="flex justify-end w-full mt-auto gap-2">
                <Button
                  size="sm"
                  class="text-sm"
                  @click="handleApproveSuggestion(item.id)"
                >
                  В базу
                </Button>
              </div>
            </CardFooter>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
