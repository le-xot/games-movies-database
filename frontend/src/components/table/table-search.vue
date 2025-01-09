<script setup lang="ts">
import { CheckIcon, XIcon } from 'lucide-vue-next'
import { computed } from 'vue'
import { Button } from '../ui/button'
import { Command, CommandItem, CommandList } from '../ui/command'
import { Input } from '../ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

const searchValue = defineModel<string>('value', { required: true })
const columnVisibility = defineModel<Record<string, boolean>>('columnVisibility', { required: true })
const placeholder = computed(() => 'Искать по названию или заказчику')

function clearSearch() {
  searchValue.value = ''
}

const columnText: Record<string, string> = {
  title: 'Название',
  genre: 'Жанр',
  person: 'Заказчик',
  status: 'Статус',
  grade: 'Оценка',
}
</script>

<template>
  <div class="flex gap-2">
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
    <Popover>
      <PopoverTrigger as-child>
        <Button variant="outline" size="sm" class="h-9 w-24">
          Столбцы
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-[150px] p-2" align="end">
        <Command>
          <CommandList>
            <CommandItem
              v-for="[filter, value] of Object.entries(columnVisibility)"
              :key="filter"
              :value="filter"
              @select="columnVisibility[filter] = !value"
            >
              <div
                class="mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary"
                :class="[value
                  ? 'bg-primary text-primary-foreground'
                  : 'opacity-50 [&_svg]:invisible',
                ]"
              >
                <CheckIcon class="h-4 w-4" />
              </div>
              <span>{{ columnText[filter] }}</span>
            </CommandItem>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  </div>
</template>
