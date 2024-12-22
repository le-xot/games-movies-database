<script lang="ts" setup>
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useFormField } from './useFormField'
import type { LabelProps } from 'radix-vue'
import type { HTMLAttributes } from 'vue'

const props = defineProps<LabelProps & { class?: HTMLAttributes['class'] }>()

const { error, formItemId } = useFormField()
</script>

<template>
  <Label
    :class="cn(
      error && 'text-destructive',
      props.class,
    )"
    :for="formItemId"
  >
    <slot />
  </Label>
</template>
