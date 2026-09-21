import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { UserController } from '../user.controller'

describe('UserController mergeUsers', () => {
  let controller: UserController
  let userService: any

  const mergeResult = {
    accountsMoved: 1,
    accountsDropped: 0,
    likesMoved: 2,
    likesDropped: 0,
    suggestionsMoved: 1,
    wordleGamesMoved: 3,
    wordleGamesDropped: 0,
  }

  beforeEach(() => {
    userService = {
      mergeUsers: mock(() => Promise.resolve(mergeResult)),
    }
    controller = new UserController(userService)
  })

  it('delegates to the service with the target id and the source user id from the body', async () => {
    const result = await controller.mergeUsers('target-id', { sourceUserId: 'source-id' })

    expect(userService.mergeUsers).toHaveBeenCalledWith('target-id', 'source-id')
    expect(result).toEqual(mergeResult)
  })
})
