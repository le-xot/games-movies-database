import { GENRES_BY_PATH } from '@/lib/genre-registry'

/**
 * Прогрев данных раздела до клика: пока курсор висит на пункте меню,
 * запрос уже уходит, и переключение происходит без скелетона. Список путей и
 * загрузчиков берётся из реестра жанров.
 */
export function prefetchMediaRecords(path: string) {
  void GENRES_BY_PATH.get(path)?.prefetch()
}
