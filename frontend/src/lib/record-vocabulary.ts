import { RecordGrade, RecordStatus } from '@/lib/api'

/**
 * Словарь статусов и оценок: короткое имя, расшифровка, цвет и класс бейджа —
 * в одном месте. Раньше лейблы и Tailwind-классы жили в бейджах, hex-цвета — в
 * статистике, а порядок оценок — ещё в двух файлах.
 *
 * `badgeClass`/`borderClass` — литеральные строки: Tailwind сканирует исходники
 * и не увидит класс, собранный из переменных.
 */
export interface RecordVocabularyEntry {
  /** Короткое имя: текст статуса или эмодзи оценки. */
  name: string
  /** Расшифровка для оценок (tooltip/подпись). */
  label?: string
  description?: string
  /** Цвет для графиков и инлайн-стилей. */
  tone: string
  /** Класс фона бейджа; отсутствует, если статус показывает стандартный вид. */
  badgeClass?: string
  borderClass?: string
}

export const STATUS_VOCABULARY = {
  [RecordStatus.QUEUE]: {
    name: 'В очереди',
    description: 'заказ ждёт своего часа.',
    tone: '#333333',
    badgeClass: 'bg-[#333333]',
  },
  [RecordStatus.UNFINISHED]: {
    name: 'Нет концовки',
    description: 'игра не имеет концовки (титров или логического завершения сюжета).',
    tone: '#28456c',
    badgeClass: 'bg-[#28456c]',
  },
  [RecordStatus.DONE]: {
    name: 'Готово',
    description: 'игра выполнена, кинолента посмотрена.',
    tone: '#2b593f',
    badgeClass: 'bg-[#2b593f]',
  },
  [RecordStatus.PROGRESS]: {
    name: 'В процессе',
    description: 'заказ находится на стадии выполнения.',
    tone: '#89632a',
    badgeClass: 'bg-[#89632a]',
  },
  [RecordStatus.DROP]: {
    name: 'Дроп',
    description: 'заказ не будет закончен до конца.',
    tone: '#6e3630',
    badgeClass: 'bg-[#6e3630]',
  },
  [RecordStatus.NOTINTERESTED]: {
    name: 'Не интересно',
    description: 'заказ не интересен.',
    tone: '#4a4a4a',
  },
} satisfies Record<RecordStatus, RecordVocabularyEntry>

export const GRADE_VOCABULARY = {
  [RecordGrade.RECOMMEND]: {
    name: '🔥',
    label: 'Рекомендую',
    description: 'надеюсь, что это понравится всем. Произведения заслуживающие внимания.',
    tone: '#28456c',
    badgeClass: 'bg-[#28456c] border',
    borderClass: 'border-[#28456c]',
  },
  [RecordGrade.LIKE]: {
    name: '👍',
    label: 'Понравилось',
    description: 'мне, но может не понравится вам. Больше вкусовщина.',
    tone: '#2b593f',
    badgeClass: 'bg-[#2b593f] border',
    borderClass: 'border-[#2b593f]',
  },
  [RecordGrade.BEER]: {
    name: '🍺',
    label: 'Под пивко',
    description: 'пойдёт. Больше чем на один разочек не тянет, как не старайся.',
    tone: '#89632a',
    badgeClass: 'bg-[#89632a] border',
    borderClass: 'border-[#89632a]',
  },
  [RecordGrade.DISLIKE]: {
    name: '👎',
    label: 'Не рекомендую',
    description: 'и считаю это пустой тратой времени и недостойным проведением досуга.',
    tone: '#6e3630',
    badgeClass: 'bg-[#6e3630] border',
    borderClass: 'border-[#6e3630]',
  },
} satisfies Record<RecordGrade, RecordVocabularyEntry>

/** Порядок статусов в статистике: `NOTINTERESTED` намеренно не показывается. */
export const STATUS_REPORT_ORDER: readonly RecordStatus[] = [
  RecordStatus.DONE,
  RecordStatus.PROGRESS,
  RecordStatus.QUEUE,
  RecordStatus.UNFINISHED,
  RecordStatus.DROP,
]

/** Порядок оценок в статистике и счётчиках друзей (совпадает с бэкендом). */
export const GRADE_REPORT_ORDER: readonly RecordGrade[] = [
  RecordGrade.RECOMMEND,
  RecordGrade.LIKE,
  RecordGrade.BEER,
  RecordGrade.DISLIKE,
]

/** Порядок кнопок оценки в карточке: от худшей к лучшей. */
export const GRADE_BUTTON_ORDER: readonly RecordGrade[] = [
  RecordGrade.DISLIKE,
  RecordGrade.BEER,
  RecordGrade.LIKE,
  RecordGrade.RECOMMEND,
]
