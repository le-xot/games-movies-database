<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import Spinner from '@/components/utils/spinner.vue'
import { RecordEntity } from '@/lib/api'
import { Shuffle } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import AuctionCard from './components/auction-card.vue'
import { useAuctions } from './composables/use-autions'

const auctions = useAuctions()

const isLoading = computed(() => auctions.isLoading)
const auctionCard = ref<InstanceType<typeof AuctionCard> | null>(null)
const showWinner = ref(false)
const randomItem = ref<RecordEntity>()

function showRandomAuction() {
  console.log('Auctions array:', auctions.auctions)

  if (!auctions.auctions || auctions.auctions.length === 0) {
    console.log('No auctions available')
    return
  }

  const randomIndex = Math.floor(Math.random() * auctions.auctions.length)
  console.log('Random index:', randomIndex)

  randomItem.value = auctions.auctions[randomIndex]
  console.log('Selected item:', randomItem.value)
  showWinner.value = true
}

function hideWinner() {
  showWinner.value = false
}

async function handleApproveSuggestion(id: number) {
  showWinner.value = false
  try {
    await auctions.approveAuction(id)
    toast({
      title: 'Успешно',
      description: '',
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
  <div class="flex flex-col gap-4 h-full">
    <div v-if="isLoading" class="flex items-center justify-center">
      <Spinner />
    </div>

    <div v-if="showWinner && randomItem" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div class="bg-background p-8 rounded-lg max-w-2xl w-full shadow-xl border border-border">
        <div class="flex flex-col gap-6">
          <h1 class="text-4xl font-bold text-center">
            {{ randomItem.title || 'Без названия' }}
          </h1>
          <div class="p-4 rounded-lg flex justify-center">
            <img
              v-if="randomItem.posterUrl"
              :src="randomItem.posterUrl"
              class="max-h-[300px] object-contain mx-auto"
              alt="Постер"
            >
            <div v-else class="h-[200px] w-full flex items-center justify-center text-muted-foreground">
              Нет изображения
            </div>
          </div>
          <div v-if="randomItem.user" class="text-base text-center font-medium">
            Предложил: {{ randomItem.user.login }}
          </div>
          <div class="text-center text-green-500 font-bold text-2xl py-3 rounded-lg">
            🎉 Победитель! 🎉
          </div>
          <div class="flex gap-4 justify-center mt-4">
            <Button variant="default" class="px-8 py-2 text-lg" @click="handleApproveSuggestion(randomItem?.id)">
              Принять
            </Button>
            <Button variant="secondary" class="px-8 py-2 text-lg" @click="hideWinner">
              Ещё разок
            </Button>
          </div>
        </div>
      </div>
    </div>

    <AuctionCard
      v-if="(auctions.auctions?.length ?? 0) > 0 && !isLoading"
      ref="auctionCard"
      kind="auction"
      :items="auctions.auctions ?? []"
    >
      <template #title>
        <div class="flex justify-between">
          Аукцион: {{ auctions.auctions?.length ?? 0 }}
          <Button v-if="(auctions.auctions?.length ?? 0) > 0" @click="showRandomAuction">
            <span class="flex items-center gap-2">
              Случайная запись
              <Shuffle class="icon" />
            </span>
          </Button>
        </div>
      </template>
    </AuctionCard>

    <div
      v-if="(auctions.auctions?.length ?? 0) === 0 && !isLoading"
      style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"
      class="text-center flex flex-col items-center"
    >
      <img class="w-[120px] h-[120px] mx-auto" src="/images/ogo.webp" alt="Ага">
      <span class="text-xl font-bold block mt-4 mb-4">Аукцион не проводится</span>
    </div>
  </div>
</template>
