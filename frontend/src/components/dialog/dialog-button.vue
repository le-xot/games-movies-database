<script setup lang="ts">
import { defineProps } from 'vue'
import { Button } from '../ui/button'

defineProps({
  icon: { type: Function, required: true },
})
</script>

<template>
  <Button variant="ghost" size="icon">
    <component :is="icon" />
  </Button>
</template>
