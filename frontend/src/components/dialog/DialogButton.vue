<script setup lang="ts">
import { Button } from '@/components/ui/button'

defineProps<{
  icon: any
}>()
</script>

<template>
  <Button variant="ghost" size="icon">
    <component :is="icon" />
  </Button>
</template>
