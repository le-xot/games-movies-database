import { describe, expect, it } from 'bun:test'
import { isEditableTarget } from './use-wordle-keyboard'

describe('isEditableTarget', () => {
  it('treats inputs as editable', () => {
    expect(isEditableTarget({ tagName: 'INPUT', isContentEditable: false })).toBe(true)
  })

  it('treats textareas as editable', () => {
    expect(isEditableTarget({ tagName: 'TEXTAREA', isContentEditable: false })).toBe(true)
  })

  it('treats contenteditable elements as editable', () => {
    expect(isEditableTarget({ tagName: 'DIV', isContentEditable: true })).toBe(true)
  })

  it('keeps regular elements non-editable', () => {
    expect(isEditableTarget({ tagName: 'BODY', isContentEditable: false })).toBe(false)
  })

  it('handles a missing target', () => {
    expect(isEditableTarget(null)).toBe(false)
    expect(isEditableTarget(undefined)).toBe(false)
  })
})
