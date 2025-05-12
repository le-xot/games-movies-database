<script setup lang="ts">
import { useDialog } from '@/components/dialog/composables/use-dialog'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useUser } from '@/composables/use-user.ts'
import { DeleteIcon, EllipsisIcon, Trash2Icon } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed, ref, toRef, watch } from 'vue'
import { useTableCol } from '../composables/use-table-col'
import { useTableUsers } from '../composables/use-table-users'

type UserValue = string | undefined

const props = defineProps<{ userId: UserValue }>()
const emits = defineEmits<{ update: [UserValue] }>()
const userId = toRef(props, 'userId')

const users = useTableUsers()
const dialog = useDialog()

const {
  isEdit,
  inputValue,
  handleClose,
  handleOpen,
  handleUpdateValue,
} = useTableCol(userId, emits)

const isOpenPopover = ref(false)
const isOpenDropdown = ref(false)
watch(isEdit, (value) => {
  if (value) return
  isOpenDropdown.value = false
})

const { isAdmin } = storeToRefs(useUser())

const searchValue = ref('')
const filteredUsers = computed(() => {
  if (!searchValue.value) return users.userOptions
  return users.userOptions.filter((user) =>
    user.name.toLowerCase().includes(searchValue.value.toLowerCase()),
  )
})

const currentUser = computed(() => {
  return users.userOptions.find((user) => user.id === userId.value)
})

async function handleColorChange(user: any, color: string) {
  try {
    await users.createOrUpdateUser({ id: user.id, data: { color } })
    await users.refetchUsers()
  } catch (error) {
    console.error('Failed to update user color:', error)
  }
}

function invokeDeleteUser(user: any) {
  dialog.openDialog({
    title: `Удалить пользователя?`,
    content: '',
    description: `Вы уверены что хотите удалить ${user.login}?`,
    onSubmit: () => {
      users.deleteUserById(user.id)
      inputValue.value = undefined
    },
  })
}

function invokeRemoveUser() {
  handleUpdateValue(null)
}

const BUTTONS_COLORS = ['#333333', '#492F64', '#28456C', '#603B2C', '#8f332a', '#69314C', '#854C1D', '#89632A', '#2B593F']
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
          :style="{ backgroundColor: currentUser?.color }"
          :disabled="!isAdmin"
        >
          <span class="w-full absolute inset-0 flex items-center justify-center">
            {{ inputValue
              ? users.userOptions.find((user) => user.id === inputValue)?.name || "Нет данных"
              : "Нет данных" }}
          </span>
          <Button
            v-if="isOpenPopover"
            variant="ghost"
            size="icon"
            class="absolute right-2 h-6 w-6 bg-transparent hover:bg-transparent"
            @click="invokeRemoveUser()"
          >
            <DeleteIcon />
          </Button>
        </Button>
      </PopoverTrigger>
      <PopoverContent class="p-0 w-[--radix-popover-trigger-width]">
        <Command>
          <div class="flex items-center border-b px-3" cmdk-input-wrapper>
            <input
              v-model="searchValue"
              class="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Искать пользователя..."
            >
          </div>
          <CommandEmpty>Пользователь не найден.</CommandEmpty>
          <CommandList
            :style="{ scrollbarGutter: 'stable' }"
            :class="{ 'overflow-hidden': isOpenDropdown }"
          >
            <CommandGroup>
              <CommandItem
                v-for="user in filteredUsers"
                :key="user.id"
                :value="user.id"
                :style="{ backgroundColor: user.color }"
                class="pr-1 m-1 h-8 flex justify-between group"
                @select="() => {
                  handleUpdateValue(user.id)
                  handleClose()
                }"
              >
                {{ user.name }}
                <DropdownMenu @update:open="isOpenDropdown = $event">
                  <DropdownMenuTrigger as-child>
                    <Button
                      :style="{ backgroundColor: user.color }"
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
                      <Button
                        variant="ghost"
                        class="w-full flex justify-between"
                        @click="invokeDeleteUser(user)"
                      >
                        <span class="truncate mr-1">Удалить</span>
                        <Trash2Icon class="size-4 shrink-0" />
                      </Button>
                      <Button
                        v-for="color in BUTTONS_COLORS"
                        :key="color"
                        :style="{ backgroundColor: color }"
                        class="size-8 rounded"
                        @click="handleColorChange(user, color)"
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
