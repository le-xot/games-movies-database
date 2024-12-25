<script setup lang="ts">
import { useDialog } from '@/components/dialog/composables/use-dialog'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { TableCell } from '@/components/ui/table'
import { Tag } from '@/components/ui/tag'
import { PersonEntity } from '@/lib/api'
import { DeleteIcon, EllipsisIcon, Trash2Icon } from 'lucide-vue-next'
import { computed, ref, toRef } from 'vue'
import { useTableCol } from '../composables/use-table-col'
import { useTablePersons } from '../composables/use-table-persons'

type PersonValue = number | undefined

const props = defineProps<{ personId: PersonValue }>()
const emits = defineEmits<{ update: [PersonValue] }>()
const personId = toRef(props, 'personId')

const persons = useTablePersons()
const dialog = useDialog()

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
    person.name.toLowerCase().includes(searchValue.value.toLowerCase()),
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

async function updatePerson(id: number, data: { name?: string, color?: string }) {
  persons.updatePerson(id, data)
}

async function handleColorChange(person: PersonEntity, color: string) {
  await updatePerson(person.id, { color })
}

async function deletePerson(id: number) {
  await persons.deletePerson(id)
}

function invokeDeletePerson(person: PersonEntity) {
  dialog.openDialog({
    title: `Удалить заказчика?`,
    description: `Вы уверены что хотите удалить ${person.name}?`,
    onSubmit: () => {
      deletePerson(person.id)
    },
  })
}

function invokeRemovePerson() {
  handleUpdateValue(null)
}

const BUTTONS_COLORS = ['#333333', '#492F64', '#28456C', '#603B2C', '#8f332a', '#69314C', '#854C1D', '#89632A', '#2B593F']
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
          class="h-8 w-[192px] justify-between text-xs"
          :style="{ backgroundColor: currentPerson?.color }"
        >
          {{ inputValue
            ? persons.personOptions.find((person) => person.id === inputValue)?.name
            : "Не выбрано" }}
          <Button
            variant="ghost" class="h-6 w-6 pr-2 bg-transparent hover:bg-transparent"
            @click="invokeRemovePerson()"
          >
            <DeleteIcon />
          </Button>
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
                :key="person.id"
                :value="person.id"
                :style="{ backgroundColor: person.color }"
                class="pr-1 m-1 h-8 flex justify-between"
                @select="() => {
                  handleUpdateValue(person.id)
                  handleClose()
                }"
              >
                {{ person.name }}
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button :style="{ backgroundColor: person.color }" variant="ghost" class="h-6 w-6 p-0" @click.stop="">
                      <EllipsisIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent class="w-36" side="right">
                    <Button
                      variant="ghost" class="w-full flex justify-between"
                      @click="invokeDeletePerson(person)"
                    >
                      Удалить
                      <Trash2Icon />
                    </Button>
                    <div class="p-2 gap-2 flex justify-center flex-wrap">
                      <Button
                        v-for="color in BUTTONS_COLORS"
                        :key="color"
                        :style="{ backgroundColor: color }"
                        class="size-8 rounded"
                        variant="ghost"
                        @click="handleColorChange(person, color)"
                      />
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
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
