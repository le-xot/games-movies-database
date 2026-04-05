import { RecordGenre } from '@/enums'

export const WsEvents = {
  UPDATE_RECORDS: 'update-records',
  UPDATE_SUGGESTIONS: 'update-suggestions',
  UPDATE_QUEUE: 'update-queue',
  UPDATE_AUCTION: 'update-auction',
  UPDATE_LIKES: 'update-likes',
  UPDATE_USERS: 'update-users',
} as const

export interface UpdateRecordsPayload {
  genre: RecordGenre
  id: number
  action: 'created' | 'updated' | 'deleted'
}

export interface UpdateSuggestionsPayload {
  id: number
  action: 'created' | 'updated' | 'deleted'
}

export interface UpdateQueuePayload {
  id: number
  action: 'created' | 'updated' | 'deleted'
}

export interface UpdateAuctionPayload {
  id: number
  action: 'created' | 'updated' | 'deleted' | 'ended'
}

export interface UpdateLikesPayload {
  recordId: number
  userId: string
  action: 'created' | 'deleted'
}

export interface UpdateUsersPayload {
  userId: string
  action: 'created' | 'updated' | 'deleted'
}
