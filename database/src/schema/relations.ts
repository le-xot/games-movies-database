import { relations } from 'drizzle-orm'
import { likes } from './likes'
import { recordRatings } from './record-ratings'
import { records } from './records'
import { suggestionOwnerships } from './suggestion-ownerships'
import { userAccounts } from './user-accounts'
import { users } from './users'
import { wordleGames } from './wordle-games'

export const usersRelations = relations(users, ({ many }) => ({
  suggestionOwnerships: many(suggestionOwnerships),
  likes: many(likes),
  ratings: many(recordRatings),
  accounts: many(userAccounts),
  wordleGames: many(wordleGames),
}))

export const recordsRelations = relations(records, ({ many, one }) => ({
  suggestionOwnership: one(suggestionOwnerships),
  likes: many(likes),
  ratings: many(recordRatings),
}))

export const ratingsRelations = relations(recordRatings, ({ one }) => ({
  user: one(users, { fields: [recordRatings.userId], references: [users.id] }),
  record: one(records, { fields: [recordRatings.recordId], references: [records.id] }),
}))

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, { fields: [likes.userId], references: [users.id] }),
  record: one(records, { fields: [likes.recordId], references: [records.id] }),
}))

export const suggestionOwnershipsRelations = relations(suggestionOwnerships, ({ one }) => ({
  record: one(records, { fields: [suggestionOwnerships.recordId], references: [records.id] }),
  user: one(users, { fields: [suggestionOwnerships.userId], references: [users.id] }),
}))

export const userAccountsRelations = relations(userAccounts, ({ one }) => ({
  user: one(users, { fields: [userAccounts.userId], references: [users.id] }),
}))

export const wordleGamesRelations = relations(wordleGames, ({ one }) => ({
  user: one(users, { fields: [wordleGames.userId], references: [users.id] }),
}))
