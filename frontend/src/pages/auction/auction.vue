<script setup lang="ts">
import Spinner from '@/components/utils/spinner.vue'
import { computed, ref } from 'vue'
import AuctionCard from './components/auction-card.vue'
import { useAuctions } from './composables/use-autions'

const auctions = useAuctions()

const isLoading = computed(() => auctions.isLoading)
const auctionCard = ref<InstanceType<typeof AuctionCard> | null>(null)
</script>

<template>
  <div class="flex flex-col gap-4 h-full">
    <div v-if="isLoading" class="flex items-center justify-center">
      <Spinner />
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
