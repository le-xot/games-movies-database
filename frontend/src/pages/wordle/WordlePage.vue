<script setup lang="ts">
import { storeToRefs } from 'pinia'
import WordleGame from '@/pages/wordle/components/WordleGame.vue'
import WordleGuestPlaceholder from '@/pages/wordle/components/WordleGuestPlaceholder.vue'
import { useUser } from '@/stores/use-user'

const { isLoggedIn, isPending } = storeToRefs(useUser())
</script>

<template>
  <WordleGame v-if="isLoggedIn" />
  <WordleGuestPlaceholder v-else-if="!isPending" />
</template>
