<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { gradeTags } from '../composables/use-table-select'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>
        📜 Оценки
      </CardTitle>
    </CardHeader>
    <CardContent>
      <h4>
        Если хотите обсудить оценку - милости прошу. Оценка не является финальной
        и может быть пересмотрена.
      </h4>
      <div v-for="[tag, options] of Object.entries(gradeTags)" :key="tag">
        <Badge>
          {{ options.name }} {{ options.label }}
        </Badge>
        {{ options.description }}
      </div>
    </CardContent>
  </Card>
</template>
