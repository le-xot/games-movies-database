<script lang="ts" setup>
import { useId } from 'reka-ui';
import { provide } from 'vue';
import { cn } from '@/lib/utils';
import { FORM_ITEM_INJECTION_KEY } from './injectionKeys';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();

const id = useId();
provide(FORM_ITEM_INJECTION_KEY, id);
</script>

<template>
  <div :class="cn('space-y-2', props.class)">
    <slot />
  </div>
</template>
