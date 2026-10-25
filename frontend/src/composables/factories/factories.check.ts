import { api } from '@/lib/api'
import type { ParamsStoreReturn } from '@/composables/factories/create-records-store'

type Equals<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
type Expect<T extends true> = T

/** Query-параметры списка записей — прямо из Eden-клиента, без кодогена. */
type ParamsQuery = NonNullable<NonNullable<Parameters<typeof api.records.get>[0]>['query']>
export type _ParamsAreRequestQuery = Expect<
  Equals<keyof ParamsStoreReturn['params'], keyof ParamsQuery>
>
export type _ParamValueTypesMatch = Expect<
  Equals<ParamsStoreReturn['params']['status'], ParamsQuery['status']> extends true
    ? Equals<ParamsStoreReturn['params']['orderBy'], ParamsQuery['orderBy']>
    : false
>
