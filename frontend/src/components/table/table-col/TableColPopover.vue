<script setup lang="ts" generic="T extends RecordStatus | RecordGrade | RecordGenre">
import { storeToRefs } from 'pinia'
import { computed, toRef, type Ref } from 'vue'
import { useTableCol } from '@/components/table/composables/use-table-col'
import {
  BadgeOptions,
  SelectKind,
  useTableSelect,
} from '@/components/table/composables/use-table-select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RecordGenre, RecordGrade, RecordStatus } from '@/lib/api'
import { useUser } from '@/stores/use-user'

type ValueSelect = T | undefined

const props = defineProps<{
  kind: SelectKind
  value: ValueSelect
  compact?: boolean
}>()
const emits = defineEmits<{ update: [ValueSelect] }>()
const selectValue = toRef(props, 'value')

const { isAdmin } = storeToRefs(useUser())

const { handleUpdateValue } = useTableCol<T | undefined>(selectValue as Ref<T | undefined>, emits)

const select = useTableSelect()
const data = computed(() => {
  const tag = select[`${props.kind}Tags`]?.[
    selectValue.value as RecordStatus & RecordGrade & RecordGenre
  ] as BadgeOptions
  return {
    tag: tag ?? null,
    options: select.options[props.kind],
  }
})

const placeholder = computed(() => {
  if (!data.value.tag) return 'Нет данных'
  return data.value.tag.name
})

function handleSelect(value: string) {
  handleUpdateValue(value)
}
</script>

<template>
  <!-- COMPACT -->
  <template v-if="compact">
    <Popover v-if="isAdmin">
      <PopoverTrigger as-child>
        <div
          class="inline-flex cursor-pointer h-6 px-2.5 items-center justify-center text-[11px] font-semibold text-white/80! select-none rounded-full w-fit"
          :class="data.tag?.class ?? 'border border-input'"
        >
          <span class="whitespace-nowrap">{{ placeholder }}</span>
        </div>
      </PopoverTrigger>
      <PopoverContent align="center" side="bottom" :side-offset="4" class="w-auto p-3">
        <div class="grid grid-cols-1 gap-2">
          <button
            v-for="option in data.options"
            :key="option.value"
            class="h-8 px-4 flex items-center justify-center text-xs font-semibold text-white/80! rounded-md border hover:opacity-80 transition-opacity cursor-pointer whitespace-nowrap"
            :class="option.class"
            @click="handleSelect(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </PopoverContent>
    </Popover>
    <div
      v-else
      class="inline-flex cursor-default h-6 px-2.5 items-center justify-center text-[11px] font-semibold select-none rounded-full w-fit"
      :class="data.tag?.class ?? 'border border-input'"
    >
      <span class="whitespace-nowrap text-white/80!">{{ placeholder }}</span>
    </div>
  </template>

  <!-- DEFAULT -->
  <template v-else>
    <Popover v-if="isAdmin">
      <PopoverTrigger as-child>
        <div
          class="w-full cursor-pointer relative h-8 flex items-center justify-center text-xs font-semibold text-white/80! min-w-28 select-none rounded-md"
          :class="data.tag?.class ?? 'border border-input'"
        >
          <span class="w-full absolute inset-0 flex items-center justify-center">
            {{ placeholder }}
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent align="center" side="bottom" :side-offset="4" class="w-auto p-3">
        <div class="grid grid-cols-1 gap-2">
          <button
            v-for="option in data.options"
            :key="option.value"
            class="h-8 px-4 flex items-center justify-center text-xs font-semibold text-white/80! rounded-md border hover:opacity-80 transition-opacity cursor-pointer whitespace-nowrap"
            :class="option.class"
            @click="handleSelect(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </PopoverContent>
    </Popover>
    <div
      v-else
      class="w-full cursor-default relative h-8 flex items-center justify-center text-xs font-semibold min-w-28 select-none rounded-md"
      :class="data.tag?.class ?? 'border border-input'"
    >
      <span class="w-full absolute inset-0 flex items-center justify-center text-white/80!">
        {{ placeholder }}
      </span>
    </div>
  </template>
</template>
