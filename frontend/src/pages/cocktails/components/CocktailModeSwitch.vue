<script setup lang="ts">
import { Button } from '@/components/ui/button'
import type { CocktailBarMode } from '@/pages/cocktails/composables/use-cocktail-bar'

defineProps<{
  modelValue: CocktailBarMode
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CocktailBarMode]
}>()

const OPTIONS = [
  { value: 'mine', label: 'Мой бар', hint: 'Набор сохраняется в аккаунте' },
  { value: 'guest', label: 'Гость', hint: 'Набор живёт только в этом браузере' },
] as const
</script>

<template>
  <div class="flex flex-col gap-1">
    <div
      class="inline-flex self-start rounded-md border p-0.5"
      role="group"
      aria-label="Чей бар используем"
    >
      <Button
        v-for="option in OPTIONS"
        :key="option.value"
        size="sm"
        :variant="modelValue === option.value ? 'secondary' : 'ghost'"
        :aria-pressed="modelValue === option.value"
        @click="emit('update:modelValue', option.value)"
      >
        {{ option.label }}
      </Button>
    </div>
    <p class="text-xs text-muted-foreground">
      {{ OPTIONS.find((option) => option.value === modelValue)?.hint }}
    </p>
  </div>
</template>
