<script setup lang="ts">
import { XIcon } from 'lucide-vue-next'
import { computed } from 'vue'
import { Input } from '../ui/input'

const searchValue = defineModel<string>('value', { required: true })
const placeholder = computed(() => 'Искать по названию или заказчику')

function clearSearch() {
  searchValue.value = ''
}
</script>

<template>
  <div class="relative w-full items-center">
    <Input
      v-model:model-value="searchValue"
      class="pr-10"
      :placeholder="placeholder"
    />
    <span class="absolute cursor-pointer end-0 inset-y-0 flex items-center justify-center px-2" @click="clearSearch">
      <XIcon class="size-4 text-muted-foreground" />
    </span>
  </div>
</template>
