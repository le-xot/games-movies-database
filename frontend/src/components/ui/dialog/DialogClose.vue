<script setup lang="ts">
import { DialogClose } from 'reka-ui'
import type { DialogCloseProps } from 'reka-ui'

const props = defineProps<DialogCloseProps>()
</script>

<template>
  <DialogClose v-bind="props">
    <slot />
  </DialogClose>
</template>
