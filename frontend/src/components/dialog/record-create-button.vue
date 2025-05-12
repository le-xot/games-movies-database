<script setup lang="ts">
import RecordCreateForm from '@/components/record/record-create-form.vue'
import { CirclePlus } from 'lucide-vue-next'
import { useDialog } from './composables/use-dialog'
import DialogButton from './dialog-button.vue'

const props = defineProps<{
  title?: string
  placeholder?: string
  onSubmit: (link: string) => void
}>()

const dialog = useDialog()

function openCreateDialog() {
  dialog.openDialog({
    title: props.title || 'Создать запись',
    description: '',
    component: RecordCreateForm,
    props: {
      title: 'Создать',
      placeholder: props.placeholder,
      onSubmit: props.onSubmit,
      onCancel: () => dialog.closeDialog(),
    },
    onSubmit: () => {},
  })
}
</script>

<template>
  <DialogButton
    :icon="CirclePlus"
    @click="openCreateDialog"
  />
</template>
