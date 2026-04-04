<script setup lang="ts">
import { AlertDialogTrigger } from 'reka-ui'
import type { AlertDialogTriggerProps } from 'reka-ui'

const props = defineProps<AlertDialogTriggerProps>()
</script>

<template>
  <AlertDialogTrigger v-bind="props">
    <slot />
  </AlertDialogTrigger>
</template>
