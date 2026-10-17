<script setup lang="ts">
import { storeToRefs } from 'pinia'
import WordleGuestPlaceholder from '@/pages/wordle/components/WordleGuestPlaceholder.vue'
import WordlePlay from '@/pages/wordle/components/WordlePlay.vue'
import { useUser } from '@/stores/use-user'

const { isLoggedIn, isPending } = storeToRefs(useUser())
</script>

<template>
  <WordlePlay v-if="isLoggedIn" />
  <WordleGuestPlaceholder v-else-if="!isPending" />
</template>
