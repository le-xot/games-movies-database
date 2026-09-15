<script setup lang="ts" generic="T extends string">
import { Check, ListFilter, X } from '@lucide/vue'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export interface FilterOption {
  value: string
  name: string
  label?: string
  class?: string
}

const props = defineProps<{
  value: T[] | null
  options: FilterOption[]
  icon?: any
  label?: string
}>()

const emit = defineEmits<{
  update: [value: T[] | null]
}>()

function toggleItem(item: string) {
  const typed = item as T
  const newValue = props.value
    ? props.value.includes(typed)
      ? props.value.filter((s) => s !== typed)
      : [...props.value, typed]
    : [typed]
  emit('update', newValue.length ? newValue : null)
}

function isSelected(value: string): boolean {
  return props.value?.includes(value as T) ?? false
}

function resetFilter() {
  emit('update', null)
}

const selectedCount = computed(() => props.value?.length ?? 0)
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button variant="outline" size="sm" class="h-9 gap-1.5 text-xs relative">
        <component :is="props.icon ?? ListFilter" class="size-3.5" />
        <span v-if="props.label" class="hidden md:inline">{{ props.label }}</span>
        <span
          v-if="selectedCount > 0"
          class="ml-0.5 h-4 min-w-4 px-1 flex items-center justify-center text-[10px] font-bold rounded-full bg-primary text-primary-foreground"
        >
          {{ selectedCount }}
        </span>
      </Button>
    </PopoverTrigger>

    <PopoverContent align="end" :side-offset="4" class="w-auto p-3">
      <div class="grid grid-cols-1 gap-2">
        <button
          v-for="option in options"
          :key="option.value"
          class="relative h-11 px-4 flex items-center justify-center text-xs font-semibold text-white/80! rounded-md border hover:opacity-80 transition-opacity cursor-pointer whitespace-nowrap"
          :class="[
            option.class,
            isSelected(option.value) && 'ring-2 ring-white ring-offset-1 ring-offset-background',
          ]"
          @click="toggleItem(option.value)"
        >
          <span v-if="option.label" class="flex items-center gap-1.5">
            <span>{{ option.name }}</span>
            <span>{{ option.label }}</span>
          </span>
          <span v-else>{{ option.name }}</span>
          <Check
            v-if="isSelected(option.value)"
            class="absolute top-0.5 right-0.5 size-3.5 text-white drop-shadow"
          />
        </button>
      </div>
      <div v-if="selectedCount > 0" class="mt-3 flex justify-center">
        <button
          class="flex items-center gap-1 h-11 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer justify-center w-full"
          @click="resetFilter"
        >
          <X class="size-3" />
          Сбросить фильтр
        </button>
      </div>
    </PopoverContent>
  </Popover>
</template>
