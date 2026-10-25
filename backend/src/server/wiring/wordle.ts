import type { GatewayDeps } from '@backend/gateway'
import type { WordleNotificationService } from '@backend/modules/wordle/wordle-notification.service'
import type { WordlePracticeService } from '@backend/modules/wordle/wordle-practice.service'
import type { WordleService } from '@backend/modules/wordle/wordle.service'

export interface WordleServices {
  wordle: WordleService
  wordlePractice: WordlePracticeService
  wordleNotifications: WordleNotificationService
}

/** Порты Wordle: ежедневный режим, тренировка и уведомления. */
export function wordlePorts({
  wordle,
  wordlePractice,
  wordleNotifications,
}: WordleServices): Pick<GatewayDeps, 'wordle' | 'wordleNotifications'> {
  return {
    wordle: {
      getState: (userId) => wordle.getState(userId),
      makeGuess: (userId, word) => wordle.makeGuess(userId, word),
      getStats: (userId) => wordle.getStats(userId),
      getLeaderboard: () => wordle.getLeaderboard(),
      getPracticeState: (userId) => wordlePractice.getState(userId),
      startPractice: (userId) => wordlePractice.start(userId),
      makePracticeGuess: (userId, word) => wordlePractice.makeGuess(userId, word),
    },
    wordleNotifications: {
      getStatus: (userId) => wordleNotifications.getStatus(userId),
      updateFlags: (userId, input) =>
        wordleNotifications.updateFlags(userId, {
          ...(input.morningEnabled !== undefined ? { morningEnabled: input.morningEnabled } : {}),
          ...(input.eveningEnabled !== undefined ? { eveningEnabled: input.eveningEnabled } : {}),
        }),
      createLink: (userId) => wordleNotifications.createLink(userId),
      disconnect: (userId) => wordleNotifications.disconnect(userId),
    },
  }
}
