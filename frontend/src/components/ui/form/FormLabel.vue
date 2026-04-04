<script lang="ts" setup>
import { useFormField } from '@/components/ui/form/useFormField'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { LabelProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

const props = defineProps<LabelProps & { class?: HTMLAttributes['class'] }>()

const { error, formItemId } = useFormField()
</script>

<template>
  <Label :class="cn(error && 'text-destructive', props.class)" :for="formItemId">
    <slot />
  </Label>
</template>
