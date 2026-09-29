import MediaCard from '@/components/media/MediaCard.vue'
import type { DialogState } from '@/components/dialog/composables/use-dialog'

type ComponentOf = DialogState<typeof MediaCard>['component']
type _HasCardComponent = Exclude<ComponentOf, undefined> extends typeof MediaCard ? true : false

export const dialogComponentInference: _HasCardComponent = true
