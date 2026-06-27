<script setup lang="ts" generic="T extends string">
import { Check, ListFilter, X } from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { Button } from '@/components/ui/button'

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

const isOpen = ref(false)
const triggerRef = ref<InstanceType<typeof Button> | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref<Record<string, string>>({})

function getTriggerEl(): HTMLElement | null {
  return triggerRef.value?.$el ?? triggerRef.value
}

function updatePosition() {
  const el = getTriggerEl()
  if (!el) return
  const rect = el.getBoundingClientRect()
  dropdownStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 4}px`,
    right: `${window.innerWidth - rect.right}px`,
  }
}

function handleDocumentClick(e: MouseEvent) {
  const target = e.target as Node
  const triggerEl = getTriggerEl()
  if (triggerEl?.contains(target)) return
  if (dropdownRef.value?.contains(target)) return
  isOpen.value = false
}

onMounted(() => document.addEventListener('click', handleDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', handleDocumentClick))

function toggle() {
  isOpen.value = !isOpen.value
  if (isOpen.value) nextTick(updatePosition)
}

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

const resetFilter = () => {
  emit('update', null)
  isOpen.value = false
}

const selectedCount = computed(() => props.value?.length ?? 0)
</script>

<template>
  <div class="relative">
    <div ref="triggerRef" @click="toggle">
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
    </div>

    <Teleport to="body">
      <div
        v-show="isOpen"
        ref="dropdownRef"
        :style="dropdownStyle"
        class="z-50 min-w-44 p-3 rounded-md border bg-popover text-popover-foreground shadow-md"
      >
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
      </div>
    </Teleport>
  </div>
</template>
