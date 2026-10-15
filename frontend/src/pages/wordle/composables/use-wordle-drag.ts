import { readonly, ref } from 'vue'
import { useWordle } from '@/pages/wordle/composables/use-wordle'

export type WordleDragSource = { kind: 'board'; index: number } | { kind: 'keyboard' }

export interface WordleDragState {
  letter: string
  source: WordleDragSource
  x: number
  y: number
  targetCell: number | null
  overBoard: boolean
  size: number
}

const DRAG_THRESHOLD_PX = 6
const DROP_TARGET_SELECTOR = '[data-wordle-drop]'
const BOARD_SELECTOR = '[data-wordle-board]'

const dragState = ref<WordleDragState | null>(null)

let pending: {
  pointerId: number
  x: number
  y: number
  letter: string
  source: WordleDragSource
  size: number
  element: HTMLElement
} | null = null
let suppressClickElement: HTMLElement | null = null

/** Браузер шлёт click после перетаскивания; гасим только первый клик с элемента-источника. */
function suppressNextClickFrom(element: HTMLElement) {
  suppressClickElement = element
  window.removeEventListener('click', handleSuppressingClick, { capture: true })
  window.addEventListener('click', handleSuppressingClick, { capture: true })
}

function handleSuppressingClick(event: MouseEvent) {
  const source = suppressClickElement
  suppressClickElement = null
  window.removeEventListener('click', handleSuppressingClick, { capture: true })
  if (source && event.target instanceof Node && source.contains(event.target)) {
    event.preventDefault()
    event.stopPropagation()
  }
}

interface WordleDropResolution {
  cell: number | null
  overBoard: boolean
}

function resolveDrop(x: number, y: number): WordleDropResolution {
  const element = document.elementFromPoint(x, y)
  const cell = element?.closest<HTMLElement>(DROP_TARGET_SELECTOR)
  const index = cell ? Number(cell.dataset.wordleDrop) : null
  return {
    cell: index !== null && Number.isInteger(index) ? index : null,
    overBoard: element?.closest(BOARD_SELECTOR) != null,
  }
}

function applyDrop(drag: WordleDragState, drop: WordleDropResolution) {
  const wordle = useWordle()

  if (drag.source.kind === 'keyboard') {
    if (drop.cell === null) return
    wordle.placeLetterAt(drop.cell, drag.letter)
    return
  }

  if (drop.cell !== null) {
    wordle.moveLetter(drag.source.index, drop.cell)
    return
  }

  // Бросок за пределы доски — буква удаляется; внутри доски мимо клетки — отмена.
  if (!drop.overBoard) wordle.removeLetterAt(drag.source.index)
}

function cleanup(wasDragging: boolean) {
  const source = pending?.element
  pending = null
  dragState.value = null
  if (wasDragging && source) suppressNextClickFrom(source)
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', handlePointerUp)
  window.removeEventListener('pointercancel', handlePointerCancel)
}

function handlePointerMove(event: PointerEvent) {
  if (!pending || event.pointerId !== pending.pointerId) return

  const drop = resolveDrop(event.clientX, event.clientY)

  if (!dragState.value) {
    const dx = event.clientX - pending.x
    const dy = event.clientY - pending.y
    if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
    dragState.value = {
      letter: pending.letter,
      source: pending.source,
      x: event.clientX,
      y: event.clientY,
      targetCell: drop.cell,
      overBoard: drop.overBoard,
      size: pending.size,
    }
  } else {
    dragState.value.x = event.clientX
    dragState.value.y = event.clientY
    dragState.value.targetCell = drop.cell
    dragState.value.overBoard = drop.overBoard
  }

  event.preventDefault()
}

function handlePointerUp(event: PointerEvent) {
  if (!pending || event.pointerId !== pending.pointerId) return
  const drag = dragState.value
  if (drag) applyDrop(drag, resolveDrop(event.clientX, event.clientY))
  cleanup(drag !== null)
}

function handlePointerCancel(event: PointerEvent) {
  if (!pending || event.pointerId !== pending.pointerId) return
  cleanup(false)
}

export function useWordleDrag() {
  function startDrag(
    event: PointerEvent,
    payload: { letter: string; source: WordleDragSource; element: HTMLElement },
  ) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (pending) return

    const rect = payload.element.getBoundingClientRect()
    pending = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      letter: payload.letter,
      source: payload.source,
      size: Math.min(rect.width, rect.height),
      element: payload.element,
    }
    window.addEventListener('pointermove', handlePointerMove, { passive: false })
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerCancel)
  }

  return { dragState: readonly(dragState), startDrag }
}
