import { beforeEach, describe, expect, it } from 'bun:test'
import { createPinia, setActivePinia } from 'pinia'
import { createDialogStore } from '@/stores/create-dialog-store'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('createDialogStore', () => {
  it('открывает, закрывает и переключает состояние', () => {
    const useDialog = createDialogStore('test/dialog')
    const dialog = useDialog()

    expect(dialog.isOpen).toBe(false)

    dialog.open()
    expect(dialog.isOpen).toBe(true)

    dialog.close()
    expect(dialog.isOpen).toBe(false)

    dialog.toggle()
    expect(dialog.isOpen).toBe(true)

    dialog.toggle()
    expect(dialog.isOpen).toBe(false)
  })

  it('даёт независимое состояние каждому id', () => {
    const first = createDialogStore('test/first')()
    const second = createDialogStore('test/second')()

    first.open()

    expect(first.isOpen).toBe(true)
    expect(second.isOpen).toBe(false)
  })
})
