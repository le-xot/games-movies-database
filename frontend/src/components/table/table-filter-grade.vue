<script setup lang="ts">
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { RecordGrade } from "@/lib/api"
import { ListFilter } from "lucide-vue-next"
import { computed } from "vue"
import { gradeTags } from "./composables/use-table-select"

const props = defineProps<{
  value: RecordGrade[] | null
}>()

const emit = defineEmits<{
  update: [value: RecordGrade[] | null]
}>()

const gradeOptions = computed(() => Object.entries(gradeTags).map(([key, value]) => ({
  value: key,
  name: value.name,
  label: value.label,
  class: value.class,
})))

function toggleGrade(grade: string) {
  const gradeValue = grade as RecordGrade

  const newValue = props.value
    ? props.value.includes(gradeValue)
      ? props.value.filter(g => g !== gradeValue) || null
      : [...props.value, gradeValue]
    : [gradeValue]
  emit("update", newValue.length ? newValue : null)
}

const resetFilter = () => emit("update", null)
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
        v-for="{ value: gradeValue, label, name, class: className } in gradeOptions"
        :key="gradeValue"
        :class="[className]"
        class="h-[45px] flex items-center"
        @select="toggleGrade(gradeValue)"
      >
        <div class="flex flex-row justify-between mx-3">
          <div class="mr-3">
            {{ name }}
          </div>
          <div class="flex items-center justify-center">
            {{ label }}
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
