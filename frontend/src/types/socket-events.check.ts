import {
  WsEvents,
  type ServerToClientEvents,
  type UpdateRecordsPayload,
} from '@/types/socket-events'
import type { RecordGenre } from '@/lib/api'

type Equals<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
type Expect<T extends true> = T

export type _KeysMirrorBackend = Expect<
  Equals<keyof ServerToClientEvents, (typeof WsEvents)[keyof typeof WsEvents]>
>

export type _GenreIsOptional = Expect<
  Equals<UpdateRecordsPayload['genre'], RecordGenre | undefined>
>
