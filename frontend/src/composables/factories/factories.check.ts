import type { ParamsStoreReturn } from '@/composables/factories/create-records-store'
import type { Records } from '@/lib/api'

type Equals<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
type Expect<T extends true> = T

type ParamsQuery = Records.RecordControllerGetAllRecords.RequestQuery
export type _ParamsAreRequestQuery = Expect<
  Equals<keyof ParamsStoreReturn['params'], keyof ParamsQuery>
>
export type _ParamValueTypesMatch = Expect<
  Equals<ParamsStoreReturn['params']['status'], ParamsQuery['status']> extends true
    ? Equals<ParamsStoreReturn['params']['orderBy'], ParamsQuery['orderBy']>
    : false
>

// намеренная опечатка удалена на GREEN-шаге
