export const RecordStatus = {
  QUEUE: 'QUEUE',
  PROGRESS: 'PROGRESS',
  DROP: 'DROP',
  NOTINTERESTED: 'NOTINTERESTED',
  UNFINISHED: 'UNFINISHED',
  DONE: 'DONE',
} as const

export type RecordStatus = (typeof RecordStatus)[keyof typeof RecordStatus]
