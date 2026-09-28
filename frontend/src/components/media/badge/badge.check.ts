import { useBadgeSelect } from '@/components/media/badge/composables/use-badge-select'
import { RecordStatus } from '@/lib/api'

type Equals<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false

type _StatusValues = Equals<
  ReturnType<typeof useBadgeSelect>['statusOptions'][number]['value'],
  RecordStatus
>

export const _ok: _StatusValues = true
