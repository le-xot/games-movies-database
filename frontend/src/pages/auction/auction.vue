<script setup lang="ts">
import { Button } from "@/components/ui/button"
import { Award } from "lucide-vue-next"
import { computed, ref } from "vue"
import { toast } from "vue-sonner"
import AuctionCard from "./components/auction-card.vue"
import { useAuctions } from "./composables/use-autions"
import WinnerSelectionModal from "./winner-selection-modal.vue"

const auctions = useAuctions()
const showWinnerModal = ref(false)

const hasAuctions = computed(() => (auctions.auctions?.length ?? 0) > 0)

async function handleApproveSuggestion(id: number) {
  try {
    await auctions.approveAuction(id)
    toast("Успешно", {
      description: "Совет был одобрен.",
    })
  } catch {
    toast.error("Ошибка", {
      description: auctions.error || "Не удалось одобрить совет.",

    })
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 h-full relative">
    <WinnerSelectionModal
      v-if="hasAuctions"
      v-model:open="showWinnerModal"
      :items="auctions.auctions!"
      @approve="handleApproveSuggestion"
    />
    <AuctionCard v-if="hasAuctions" kind="auction" :items="auctions.auctions!">
      <template #title>
        <div class="flex justify-between items-center w-full">
          <span>Аукцион: {{ auctions.auctions?.length }}</span>
          <Button @click="showWinnerModal = true">
            <Award class="h-4 w-4 mr-2" />
            Выбрать победителя
          </Button>
        </div>
      </template>
    </AuctionCard>
    <div v-else class="text-center flex flex-col items-center">
      <img class="w-[120px] h-[120px] mx-auto" src="/images/ogo.webp" alt="Ага">
      <span class="text-xl font-bold block mt-4 mb-4">Аукцион не проводится</span>
    </div>
  </div>
</template>
