<script setup lang="ts">
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useDialog } from './composables/use-dialog'

const dialog = useDialog()
</script>

<template>
  <AlertDialog v-model:open="dialog.isOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ dialog.dialogState?.title }}</AlertDialogTitle>
        <div v-if="dialog.dialogState?.description" class="text-muted-foreground text-sm" v-html="dialog.dialogState?.description" />
      </AlertDialogHeader>
      <component
        :is="dialog.dialogState.component"
        v-if="dialog.dialogState?.component"
        v-bind="dialog.dialogState?.props || {}"
      />
      <AlertDialogFooter v-if="!dialog.dialogState?.component">
        <AlertDialogCancel @click="dialog.dialogState?.onCancel?.()">
          Отменить
        </AlertDialogCancel>
        <AlertDialogAction @click="dialog.submitDialog">
          Подтвердить
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
