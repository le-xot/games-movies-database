<script setup lang="ts">
import { AvatarImage } from 'reka-ui'
import type { AvatarImageProps } from 'reka-ui'

const props = defineProps<AvatarImageProps>()
</script>

<template>
  <AvatarImage v-bind="props" class="h-full w-full object-cover">
    <slot />
  </AvatarImage>
</template>
