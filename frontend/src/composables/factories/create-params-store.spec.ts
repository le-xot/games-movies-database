import { beforeEach, describe, expect, it } from 'bun:test'
import { createPinia, setActivePinia } from 'pinia'
import { createParamsStore } from '@/composables/factories/create-params-store'
import { RecordGenre, RecordGrade, RecordStatus, RecordType } from '@/lib/api'

describe('createParamsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('builds typed defaults', () => {
    const useStore = createParamsStore({ storeId: 'test/params-defaults', genre: RecordGenre.GAME })
    const store = useStore()

    expect(store.params).toMatchObject({
      genre: RecordGenre.GAME,
      type: RecordType.WRITTEN,
      search: '',
      orderBy: 'id',
      direction: 'desc',
    })
    expect(store.params.status).toBeUndefined()
    expect(store.params.grade).toBeUndefined()
  })

  it('adds status and grade filters when set', () => {
    const useStore = createParamsStore({ storeId: 'test/params-filters', genre: RecordGenre.ANIME })
    const store = useStore()

    store.setStatusFilter([RecordStatus.QUEUE])
    store.setGradeFilter([RecordGrade.LIKE])

    expect(store.params.status).toEqual([RecordStatus.QUEUE])
    expect(store.params.grade).toEqual([RecordGrade.LIKE])
  })
})
