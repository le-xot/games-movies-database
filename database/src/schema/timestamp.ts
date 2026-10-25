import { customType } from 'drizzle-orm/pg-core'

/**
 * `timestamp(3)` без таймзоны, который отдаёт ISO-строку.
 *
 * Drizzle в режиме `date` возвращает `Date`, а домен и HTTP-контракт работают с
 * ISO-строкой. Конвертация живёт здесь, на границе с БД, а не в слое адаптеров
 * на каждый ответ. `fromDriver` повторяет то, что drizzle делает сам
 * (`new Date(value + '+0000')`), поэтому инстант не меняется.
 */
export const isoTimestamp = customType<{ data: string; driverData: string }>({
  dataType: () => 'timestamp(3)',
  fromDriver: (value) => new Date(`${value}+0000`).toISOString(),
  toDriver: (value) => value,
})
