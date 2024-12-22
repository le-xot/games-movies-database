<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { TableCell } from '@/components/ui/table'
import { Tag } from '@/components/ui/tag'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-vue-next'
import { computed, ref, toRef } from 'vue'
import { useTableCol } from '../composables/use-table-col'
import { useTablePersons } from '../composables/use-table-persons'

type PersonValue = number | undefined

const props = defineProps<{ personId: PersonValue }>()
const emits = defineEmits<{ update: [PersonValue] }>()
const personId = toRef(props, 'personId')

const persons = useTablePersons()

const {
  isEdit,
  inputValue,
  handleClose,
  handleOpen,
  handleUpdateValue,
} = useTableCol(personId, emits)

const searchValue = ref('')
const filteredPersons = computed(() => {
  if (!searchValue.value) return persons.personOptions
  return persons.personOptions.filter((person) =>
    person.label.toLowerCase().includes(searchValue.value.toLowerCase()),
  )
})

const currentPerson = computed(() => {
  return persons.persons!.find((person) => person.id === personId.value)
})

async function createNewPerson() {
  if (filteredPersons.value.length || !searchValue.value) return
  const { data } = await persons.createPerson({ name: searchValue.value })
  searchValue.value = ''
  handleUpdateValue(data.id)
  handleClose()
}
</script>

<template>
  <TableCell @click="handleOpen">
    <Popover
      v-if="isEdit"
      default-open
      @update:open="(isOpen) => !isOpen && handleClose()"
    >
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          role="combobox"
          :aria-expanded="true"
          class="h-8 w-[200px] justify-between"
        >
          {{ inputValue
            ? persons.personOptions.find((person) => person.value === inputValue)?.label
            : "Искать заказчика..." }}
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-[200px] p-0">
        <Command v-model:search-term="searchValue">
          <CommandInput
            class="h-9"
            placeholder="Искать заказчика..."
            @keydown.enter="createNewPerson"
          />
          <CommandEmpty>Заказчик не найден.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              <CommandItem
                v-for="person in filteredPersons"
                :key="person.value"
                :value="person.value"
                @select="() => {
                  handleUpdateValue(person.value)
                  handleClose()
                }"
              >
                {{ person.label }}
                <Check
                  :class="cn(
                    'ml-auto h-4 w-4',
                    inputValue === person.value ? 'opacity-100' : 'opacity-0',
                  )"
                />
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
    <template v-else>
      <Tag
        class="truncate w-48"
        :style="{ backgroundColor: currentPerson?.color }"
      >
        {{ currentPerson?.name }}
      </Tag>
    </template>
  </TableCell>
</template>
