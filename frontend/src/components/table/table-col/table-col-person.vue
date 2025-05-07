<script setup lang="ts">
import { useDialog } from '@/components/dialog/composables/use-dialog'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useUser } from '@/composables/use-user.ts'
import { PersonEntity } from '@/lib/api'
import { DeleteIcon, EllipsisIcon, PencilIcon, Trash2Icon } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed, ref, toRef, watch } from 'vue'
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

const isOpenPopover = ref(false)
const isOpenDropdown = ref(false)
watch(isEdit, (value) => {
  if (value) return
  isOpenDropdown.value = false
})

const { isAdmin } = storeToRefs(useUser())

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

function invokeDeletePerson(person: PersonEntity) {
  dialog.openDialog({
    title: `Удалить заказчика?`,
    content: '',
    description: `Вы уверены что хотите удалить ${person.name}?`,
    onSubmit: () => {
      persons.deletePersonById(person.id)
      inputValue.value = undefined
    },
  })
}

function invokeRemovePerson() {
  handleUpdateValue(null)
}

const BUTTONS_COLORS = ['#333333', '#492F64', '#28456C', '#603B2C', '#8f332a', '#69314C', '#854C1D', '#89632A', '#2B593F']

const editingName = ref(false)
const nameInputValue = ref('')

function startNameEdit(person: PersonEntity) {
  nameInputValue.value = person.name
  editingName.value = true
}

function saveNameEdit(person: PersonEntity) {
  if (nameInputValue.value && nameInputValue.value !== person.name) {
    updatePerson(person.id, { name: nameInputValue.value })
  }
  editingName.value = false
}

// Custom directive for auto-focusing the input
const vFocus = {
  mounted: (el: HTMLElement) => el.focus(),
}
</script>

<template>
  <div class="w-full" @click="handleOpen">
    <Popover
      v-model:open="isOpenPopover"
      @update:open="(isOpen) => {
        if (!isOpen) handleClose()
      }"
    >
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          role="combobox"
          :aria-expanded="true"
          class="w-full cursor-default relative h-8 flex items-center text-xs font-semibold !opacity-100"
          :style="{ backgroundColor: currentPerson?.color }"
          :disabled="!isAdmin"
        >
          <span class="w-full absolute inset-0 flex items-center justify-center">
            {{ inputValue
              ? persons.personOptions.find((person) => person.id === inputValue)?.name || "Нет данных"
              : "Нет данных" }}
          </span>
          <Button
            v-if="isOpenPopover"
            variant="ghost"
            size="icon"
            class="absolute right-2 h-6 w-6 bg-transparent hover:bg-transparent"
            @click="invokeRemovePerson()"
          >
            <DeleteIcon />
          </Button>
        </Button>
      </PopoverTrigger>
      <PopoverContent class="p-0 w-[--radix-popover-trigger-width]">
        <Command v-model:search-term="searchValue">
          <CommandInput
            name="search"
            class="h-9"
            placeholder="Искать заказчика..."
            @keydown.enter="createNewPerson"
          />
          <CommandEmpty>Заказчик не найден.</CommandEmpty>
          <CommandList
            :style="{ scrollbarGutter: 'stable' }"
            :class="{ 'overflow-hidden': isOpenDropdown }"
          >
            <CommandGroup>
              <CommandItem
                v-for="person in filteredPersons"
                :key="person.id"
                :value="person.id"
                :style="{ backgroundColor: person.color }"
                class="pr-1 m-1 h-8 flex justify-between group"
                @select="() => {
                  handleUpdateValue(person.id)
                  handleClose()
                }"
              >
                {{ person.name }}
                <DropdownMenu @update:open="isOpenDropdown = $event">
                  <DropdownMenuTrigger as-child>
                    <Button
                      :style="{ backgroundColor: person.color }"
                      class="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      variant="ghost"
                      @click.stop="isOpenDropdown = false"
                    >
                      <EllipsisIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    class="w-40"
                    side="right"
                    align="start"
                    :align-offset="-8"
                    :side-offset="26"
                  >
                    <div class="p-2 gap-2 flex justify-center flex-wrap">
                      <div v-if="editingName" class="w-full mb-2">
                        <input
                          v-model="nameInputValue"
                          v-focus
                          class="w-full p-1 text-sm border rounded bg-background text-foreground"
                          @keydown.enter="saveNameEdit(person)"
                          @keydown.escape="editingName = false"
                          @click.stop
                        >
                        <Button
                          variant="outline"
                          class="w-full mt-1 text-xs"
                          @click="saveNameEdit(person)"
                        >
                          Подтвердить
                        </Button>
                      </div>
                      <Button
                        v-else
                        variant="ghost"
                        class="w-full flex justify-between"
                        @click="startNameEdit(person)"
                      >
                        <span class="truncate mr-1">Изменить</span>
                        <PencilIcon class="size-4 shrink-0" />
                      </Button>
                      <Button
                        variant="ghost"
                        class="w-full flex justify-between"
                        @click="invokeDeletePerson(person)"
                      >
                        <span class="truncate mr-1">Удалить</span>
                        <Trash2Icon class="size-4 shrink-0" />
                      </Button>
                      <Button
                        v-for="color in BUTTONS_COLORS"
                        :key="color"
                        :style="{ backgroundColor: color }"
                        class="size-8 rounded"
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
  </div>
</template>
