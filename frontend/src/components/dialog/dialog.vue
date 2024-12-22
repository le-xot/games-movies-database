<script setup lang="ts">
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useDialog } from './composables/use-dialog'

const dialog = useDialog()
</script>

<template>
  <AlertDialog v-model:open="dialog.isOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ dialog.dialogState?.title }}</AlertDialogTitle>
        <AlertDialogDescription> {{ dialog.dialogState?.description }} </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Отменить</AlertDialogCancel>
        <AlertDialogAction @click="dialog.submitDialog">
          Подтвердить
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
