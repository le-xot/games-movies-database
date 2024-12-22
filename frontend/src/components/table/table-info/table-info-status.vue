<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { statusTags } from '../composables/use-table-select'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>
        📌 Статусы
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div v-for="[tag, options] of Object.entries(statusTags)" :key="tag">
        <Badge>
          {{ options.name }}
        </Badge>
        - {{ options.description }}
      </div>
    </CardContent>
  </Card>
</template>
