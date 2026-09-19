import { inject, provide, ref, type InjectionKey, type Ref } from 'vue'

export type ScrollContainerRef = Ref<HTMLElement | null>

const SCROLL_CONTAINER_KEY: InjectionKey<ScrollContainerRef> = Symbol('scroll-container')

export function provideScrollContainer(element: ScrollContainerRef) {
  provide(SCROLL_CONTAINER_KEY, element)
}

export function useScrollContainer(): ScrollContainerRef {
  return inject(SCROLL_CONTAINER_KEY, ref(null))
}
