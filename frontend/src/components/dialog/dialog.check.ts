import MediaCard from '@/components/media/MediaCard.vue'
import type { DialogState } from '@/components/dialog/composables/use-dialog'

type Props = NonNullable<DialogState<typeof MediaCard>['props']>
type _HasItemProp = 'item' extends keyof Props ? true : false

export const dialogPropsInference: _HasItemProp = true
