<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Info } from 'lucide-vue-next'
import { ref } from 'vue'

defineProps<{
  title: string
}>()

const isShow = ref(false)
</script>

<template>
  <div class="table-info">
    {{ title }}
    <Button
      @click="isShow = true"
    >
      <template #icon>
        <Info />
      </template>
    </Button>
    <Dialog v-model:show="isShow">
      <slot />
    </Dialog>
  </div>
</template>

<style lang="scss">
.table-info {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;

  &-card {
    width: 800px;
  }
}

.card-content {
  font-size: 16px;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  b {
    text-decoration-line: underline;
  }
}
</style>
