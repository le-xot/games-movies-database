<script setup lang="ts" generic="T extends string">
import { ListFilter } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface FilterOption {
  value: string;
  name: string;
  label?: string;
  class?: string;
}

const props = defineProps<{
  value: T[] | null;
  options: FilterOption[];
}>();

const emit = defineEmits<{
  update: [value: T[] | null];
}>();

function toggleItem(item: string) {
  const typed = item as T;
  const newValue = props.value
    ? props.value.includes(typed)
      ? props.value.filter((s) => s !== typed)
      : [...props.value, typed]
    : [typed];
  emit('update', newValue.length ? newValue : null);
}

const resetFilter = () => emit('update', null);
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon">
        <ListFilter class="size-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="w-full flex flex-col" align="end" side="bottom">
      <DropdownMenuItem
        v-for="option in options"
        :key="option.value"
        :class="[option.class]"
        class="h-[45px] flex items-center"
        @select="toggleItem(option.value)"
      >
        <div v-if="option.label" class="flex flex-row justify-between mx-3">
          <div class="mr-3">
            {{ option.name }}
          </div>
          <div class="flex items-center justify-center">
            {{ option.label }}
          </div>
        </div>
        <div v-else class="flex flex-row justify-center w-full">
          <div>
            {{ option.name }}
          </div>
        </div>
      </DropdownMenuItem>
      <DropdownMenuItem class="justify-center h-[45px]" @select="resetFilter">
        Сбросить фильтр
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
