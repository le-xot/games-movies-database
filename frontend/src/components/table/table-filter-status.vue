<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { StatusesEnum } from '@/lib/api.ts'
import { ListFilter } from 'lucide-vue-next'
import { computed } from 'vue'
import { statusTags } from './composables/use-table-select'

const props = defineProps<{
  value: StatusesEnum[] | null
}>()

const emit = defineEmits<{
  update: [value: StatusesEnum[] | null]
}>()

const statusOptions = computed(() => Object.entries(statusTags).map(([key, value]) => ({
  value: key,
  name: value.name,
  class: value.class,
})))

function toggleStatus(status: string) {
  const statusValue = status as StatusesEnum

  const newValue = props.value
    ? props.value.includes(statusValue)
      ? props.value.filter(s => s !== statusValue) || null
      : [...props.value, statusValue]
    : [statusValue]
  emit('update', newValue.length ? newValue : null)
}

const resetFilter = () => emit('update', null)
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        size="icon"
      >
        <ListFilter class="size-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="w-full flex flex-col" align="end" side="bottom">
      <DropdownMenuItem
        v-for="{ value: statusValue, name, class: className } in statusOptions"
        :key="statusValue"
        :class="[className]"
        class="h-[45px] flex items-center"
        @select="toggleStatus(statusValue)"
      >
        <div class="flex flex-row justify-center w-full">
          <div>
            {{ name }}
          </div>
        </div>
      </DropdownMenuItem>
      <DropdownMenuItem
        class="justify-center h-[45px]"
        @select="resetFilter"
      >
        Сбросить фильтр
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
