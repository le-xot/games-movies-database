export const UFA_TIME_ZONE = 'Asia/Yekaterinburg'

export function getHourInTimeZone(date: Date): number {
  return Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: UFA_TIME_ZONE,
      hour: 'numeric',
      hourCycle: 'h23',
    }).format(date),
  )
}
