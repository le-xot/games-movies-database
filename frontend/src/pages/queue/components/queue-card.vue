<script setup lang="ts">
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { QueueItemDto } from '@/lib/api.ts'

defineProps<{ items: QueueItemDto[] }>()

function isShow(item: QueueItemDto) {
  return item.title && item.personName
}
</script>

<template>
  <div>
    <p class="title">
      <slot name="title" />
    </p>
    <div class="grid">
      <template v-for="(item, index) in items" :key="index">
        <Card
          v-if="isShow(item)"
          class="card"
        >
          <CardHeader>
            <CardTitle>{{ item.title }}</CardTitle>
          </CardHeader>
          <CardFooter>
            <div class="person">
              <div class="person-name">
                {{ item.personName }}
              </div>
              <slot name="footer" :item="item" />
            </div>
          </CardFooter>
        </Card>
      </template>
    </div>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
}

.card {
  background-color: var(--n-action-color);
  height: 100% ;
  justify-content: space-between;
}

.title {
  padding-bottom: 1rem;
  color: #fff;
  font-size: 1.5rem;
}

.person {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between
}

.person-name {
  display: flex;
  justify-content: flex-end
}
</style>
